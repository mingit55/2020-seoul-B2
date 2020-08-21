class App {
    constructor(){
        new IDB("seoul", ["papers", "inventory"], conn => {
            this.db = conn;
            this.ws = new Workspace(this);
            
            this.helpTexts = {
                select: `선택 도구는 가장 기본적인 도구로써, 작업 영역 내의 한지를 선택할 수 있게 합니다. 마우스 클릭으로 한지를 활성화하여 이동시킬 수 있으며, 선택된 한지는 삭제 버튼으로 삭제시킬 수 있습니다.`,
                spin: `회전 도구는 작업 영역 내의 한지를 회전할 수 있는 도구입니다. 마우스 더블 클릭으로 회전하고자 하는 한지를 선택하면, 좌우로 마우스를 끌어당겨 회전시킬 수 있습니다. 회전한 뒤에는 우 클릭의 콘텍스트 메뉴로 '확인'을 눌러 한지의 회전 상태를 작업 영역에 반영할 수 있습니다.`,
                cut: `자르기 도구는 작업 영역 내의 한지를 자를 수 있는 도구입니다. 마우스 더블 클릭으로 자르고자 하는 한지를 선택하면 마우스를 움직임으로써 자르고자 하는 궤적을 그릴 수 있습니다. 궤적을 그린 뒤에는 우 클릭의 콘텍스트 메뉴로 '자르기'를 눌러 그려진 궤적에 따라 한지를 자를 수 있습니다.`,
                glue: `붙이기 도구는 작업 영역 내의 한지들을 붙일 수 있는 도구입니다. 마우스 더블 클릭으로 붙이고자 하는 한지를 선택하면 처음 선택한 한지와 근접한 한지들을 선택할 수 있습니다. 붙일 한지를 모두 선택한 뒤에는 우 클릭의 콘텍스트 메뉴로 '붙이기'를 눌러 선택한 한지를 붙일 수 있습니다.`
            };
            this.findItems = [];
            this.findIdx = 0;
    
    
            this.entryModule = new HashModule("#entry-tags");
            
            this.setEvents();
        });

    }

    // 컨텍스트 메뉴 생성
    makeContextMenu(x, y, menus){
        $(".context-menu").remove();

        let $menus = $(`<div class="context-menu" style="left: ${x}px; top: ${y}px"></div>`);
        menus.forEach(({name, onclick}) => {
            let $menu = $(`<div class="context-menu__item">${name}</div>`)
            $menu.on("mousedown", onclick);
            $menus.append($menu);
        });
        $(document.body).append($menus);
    }

    // 이벤트 설정
    setEvents(){
        // 콘텍스트 메뉴
        $(window).on("mousedown", e => {
            $(".context-menu").remove();
        });

        // 툴 선택
        $("[data-tool].tool__item").on("click", e => {
            if(this.ws.selectedTool && this.ws.selectedTool.cancel)
                this.ws.selectedTool.cancel()

            Object.keys(this.ws.tools).forEach(tname => this.ws.tools[tname].selected = null);

            this.ws.papers.forEach(paper => paper.active = false);
            

            if(!e.currentTarget.classList.contains("active")){
                $(".tool__item").removeClass("active");
                e.currentTarget.classList.add("active");
    
                let toolName = e.currentTarget.dataset.tool;
                this.ws.selectedName = toolName;
            } else {
                $(".tool__item").removeClass("active");
                this.ws.selectedName = null;
            }
        });

        // 한지 리스트 모달
        $("[data-target='#list-modal']").on("click", async e => {
            let inventory = await this.db.getAll("inventory")
            let htmlItems = inventory.map(item => `<div class="paper-item col-lg-4 mb-4" data-id="${item.id}">
                                                        <div class="border">
                                                            <img src="${item.image}" alt="한지 이미지" class="fit-cover hx-200">
                                                            <div class="p-3">
                                                                <div class="fx-2 mb-2">${item.paper_name}</div>
                                                                <div class="fx-n2">
                                                                    <span class="text-muted">사이즈</span>
                                                                    <span class="fx-2 ml-2">${item.width_size}px × ${item.height_size}px</span>
                                                                </div>
                                                                <div class="fx-n2">
                                                                    <span class="text-muted">소지 수량</span>
                                                                    <span class="fx-2 ml-2">${item.count}개</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>`);
            
            $("#list-modal .row").html(htmlItems.length > 0 ? htmlItems.join('') : `<div class="col-12 py-5 text-center">구매한 한지가 없습니다.</div>`);
        });
        $("#list-modal").on("click", ".paper-item", async e => {
            let paper = await this.db.get("inventory", parseInt(e.currentTarget.dataset.id));
            let width = paper.width_size;
            let height = paper.height_size;
            let imageURL = paper.image;
            paper.count--;

            this.ws.addPaper({width, height, imageURL});

            if(paper.count <= 0) {
                this.db.delete("inventory", paper.id);
            } else {
                this.db.put("inventory", paper);
            }

            $("#list-modal").modal("hide");
        });

        // 한지 삭제
        $("[data-role='remove']").on("mousedown", e => {
            let selected = this.ws.tools.select.selected;
            if(selected){
                this.ws.papers = this.ws.papers.filter(paper => paper != selected);
            }
        });

        // 도움말 영역
        $(".help-search .search").on("click", e => {
            let keyword = $(".help-search input").val().replace(/([\.+*?^$\(\)\[\]\\\\\\/])/g, "\\$1");
            let regex = keyword == "" ? /^$/ : new RegExp(`(${keyword})`, "g");

            Object.keys(this.helpTexts).forEach(name =>{
                let text = this.helpTexts[name];
                $(".help-item." + name).html(text.replace(regex, m1 => `<span>${m1}</span>`));
            });

            let totalLength = $(".help-item span").length;
            
            this.findIdx = 0;
            this.findItems = Array.from($(".help-item > span"));
            if(this.findItems.length > 0) this.findItems[0].classList.add("active");
            $(".help-search > span").text( totalLength > 0 ? `${totalLength}개 중 1번째` : "일치하는 내용이 없습니다." );
        });

        $(".help-search .next").on("click", e => {
            if(this.findItems.length == 0) return;

            this.findItems[this.findIdx].classList.remove("active");
            this.findIdx = this.findIdx + 1 >= this.findItems.length ? 0 : this.findIdx + 1;
            this.findItems[this.findIdx].classList.add("active");
            $(".help-search > span").text( `${this.findItems.length}개 중 ${this.findIdx + 1}번째` );

            let type = this.findItems[this.findIdx].parentElement.dataset.type;
            $(".help > input").attr("checked" , false);
            $("#tab-" + type).attr("checked", true);
        });

        $(".help-search .prev").on("click", e => {
            if(this.findItems.length == 0) return;

            this.findItems[this.findIdx].classList.remove("active");
            this.findIdx = this.findIdx - 1 < 0 ? this.findItems.length - 1 : this.findIdx - 1;
            this.findItems[this.findIdx].classList.add("active");
            $(".help-search > span").text( `${this.findItems.length}개 중 ${this.findIdx + 1}번째` );

            let type = this.findItems[this.findIdx].parentElement.dataset.type;
            $(".help > input").attr("checked" , false);
            $("#tab-" + type).attr("checked", true);
        });
    }    
}

$(function(){
    let app = new App();
});