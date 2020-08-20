class App {
    constructor(){
        this.artwork = new Artwork();

        
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
    }

    setEvents(){
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