class Paper {
    constructor({id, image, paper_name, company_name, width_size, height_size, point, hashTags}){
        this.id = id;
        this.image = image;
        this.paper_name = paper_name;
        this.company_name = company_name;
        this.width_size = width_size;
        this.height_size = height_size;
        this.point = point;
        this.hashTags = hashTags;
        this.buyCount = 0;

        this.updateStore();
        this.updateCart();
    }

    get totalPoint(){
        return this.buyCount * this.point;
    }

    // 상품 정보 갱신
    updateStore(){
        if(!this.$storeItem){
            this.$storeItem = $(`<div class="col-lg-3 mb-4">
                                    <div class="border">
                                        <img src="${this.image}" alt="한지 이미지" class="fit-cover hx-200">
                                        <div class="p-3">
                                            <div class="fx-2 mb-2">${this.paper_name}</div>
                                            <div class="mt-1">
                                                <span class="fx-n2 text-muted">업체명</span>
                                                <span class="fx-n1 ml-2">${this.company_name}</span>
                                            </div>
                                            <div class="mt-1">
                                                <span class="fx-n2 text-muted">사이즈</span>
                                                <span class="fx-n1 ml-2">${this.width_size}px × ${this.height_size}px</span>
                                            </div>
                                            <div class="mt-1">
                                                <span class="fx-n2 text-muted">포인트</span>
                                                <span class="fx-n1 ml-2">${this.point}p</span>
                                            </div>
                                            <div class="mt-3">
                                                ${this.hashTags.map(tag => `<span class="fx-n3 text-muted">#${tag}</span>`).join('')}
                                            </div>
                                            <div class="mt-4">
                                                <button class="btn-filled btn-buy" data-id="${this.id}">구매하기</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>`);
        } else {
            this.$storeItem.find(".btn-buy").text( this.buyCount > 0 ? `추가하기(${this.buyCount}개)` : '구매하기');
        }
    }

    // 장바구니 정보 갱신
    updateCart(){
        if(!this.$cartItem){
            this.$cartItem = $(`<div class="t-row">
                                    <div class="cell-50">
                                        <div class="d-flex align-items-center">
                                            <img src="${this.image}" alt="한지 이미지" width="80" height="80">
                                            <div class="text-left px-4">
                                                <div class="fx-2">
                                                    ${this.paper_name}
                                                    <small class="text-red ml-1">${this.point}p</small>
                                                </div>
                                                <div class="fx-n1 text-muted">${this.company_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="cell-20">
                                        <input type="number" class="buy-count form-control d-inline-block" style="width: 100px;" value="${this.buyCount}" data-id="${this.id}" min="1" max="1000">
                                    </div>
                                    <div class="cell-20 total-price">${this.totalPoint}p</div>
                                    <div class="cell-10">
                                        <button class="btn-filled btn-remove" data-id="${this.id}">삭제</button>
                                    </div>
                                </div>`);
        } else {
            this.$cartItem.find(".buy-count").val(this.buyCount);
            this.$cartItem.find(".total-price").text(this.totalPoint + "p");
        }
    }
}

class App {
    constructor(){
        new IDB("seoul", ["papers", "inventory"], async db =>{
            this.db = db;
            let papers = await this.db.getAll("papers");
            this.papers = papers.length > 0 ? papers : await this.init();
            this.papers = this.papers.map(paper => new Paper(paper));
            this.cartList = [];
            
            this.$store = $("#store");
            this.$cart = $("#cart");
            
            
            this.tags = this.papers.reduce((arr, paper) => [...arr, ...paper.hashTags], []);
            this.searchTags = [];
            this.searchModule = new HashModule("#search_tags", this.tags);
            this.addModule = new HashModule("#add_tags", this.tags);

            this.renderStore();
            this.renderCart();
            this.setEvents();
        });
    }

    get totalPoint(){
        return this.cartList.reduce((p, c) => p + c.totalPoint, 0);
    }

    get totalCount(){
        return this.cartList.reduce((p, c) => p + c.buyCount, 0);
    }

    // 상품 리스트 구성
    renderStore(){
        let viewList = this.papers;

        if(this.searchTags.length > 0){
            viewList = viewList.filter(paper => this.searchTags.every(tag => paper.hashTags.includes(tag)));
        }

        this.$store.html('');
        viewList.forEach(viewItem => {
            viewItem.updateStore();
            this.$store.append(viewItem.$storeItem);
        });

        if(viewList.length === 0) this.$store.html(`<div class="py-5 text-center text-muted">검색된 상품이 없습니다.</div>`);
    }

    // 장바구니 구성
    renderCart(){
        let viewList = this.cartList;

        this.$cart.html('');
        viewList.forEach(viewItem => {
            viewItem.updateCart();
            this.$cart.append(viewItem.$cartItem);
        });

        if(viewList.length === 0) this.$cart.html(`<div class="py-5 text-center text-muted">장바구니에 담긴 상품이 없습니다.</div>`);

        $("#total-price").text(this.totalPoint);
    }

    // JSON 파일을 모두 IDB에 업로드
    async init(){
        const res = await fetch("/json/papers.json");
        const papers = await res.json();
        return papers.map(paper => {
            paper.id = parseInt(paper.id);
            paper.image = "/images/papers/" + paper.image;
            paper.width_size = parseInt(paper.width_size);
            paper.height_size = parseInt(paper.height_size);
            paper.point = parseInt(paper.point);
            paper.hashTags = [];
            this.db.add("papers", paper);
            return paper;
        });
    }

    setEvents(){
        // 검색
        $(".btn-search").on("click", e => {
            this.searchTags = this.searchModule.tags.slice(0);
            this.renderStore();
        });

        // 이미지 -> base64
        $("#add_image").on("change", e => {
            if(e.target.files.length > 0){
                let reader = new FileReader();
                reader.readAsDataURL(e.target.files[0]);
                reader.onload = () => {
                    $("#add_base64").val(reader.result);
                }
            }
        });

        // 한지 등록
        $("#add-modal").on("submit", e => {
            e.preventDefault();
            let paper = Array.from($(e.target).find("input[name]"))
                .reduce((obj, input) => {
                    obj[input.name] = input.value;
                    return obj;
                }, {});
            paper.width_size = parseInt(paper.width_size);
            paper.height_size = parseInt(paper.height_size);
            paper.point = parseInt(paper.point);
            paper.hashTags = JSON.parse(paper.hashTags);
            this.db.add("papers", paper)
                .then(id => {
                    // 마무리
                    paper.id = id;
                    $(e.target).find("input").val("");
                    $(e.target).modal("hide");
                    this.papers.push( new Paper(paper) );
                    this.tags.push(...paper.hashTags);
                    this.renderStore();
                })

        });

        // 구매 리스트 추가
        this.$store.on("click", ".btn-buy", e => {
            let paper = this.papers.find(paper => paper.id == e.currentTarget.dataset.id);
            paper.buyCount++;
            if(!this.cartList.includes(paper)) this.cartList.push(paper);
            this.renderCart();
            this.renderStore();
        });

        // 구매 리스트 삭제
        this.$cart.on("click", ".btn-remove", e => {
            let paper = this.papers.find(paper => paper.id == e.currentTarget.dataset.id);
            paper.buyCount = 0;
            this.cartList = this.cartList.filter(cartItem => cartItem.id != paper.id);
            this.renderCart();
            this.renderStore();
        });

        // 구매리스트 수량 조절
        this.$cart.on("input", ".buy-count", e => {
            let id = e.currentTarget.dataset.id;
            let value = parseInt(e.target.value);
            if(isNaN(value) || !value) value = 1;
            else if(value > 1000) value = 1000;
            else if(value < 1) value = 1;

            let paper = this.papers.find(paper => paper.id == id);
            paper.buyCount = value;

            this.renderCart();
            this.renderStore();
            $(`[data-id='${id}'].buy-count`).focus();
            
        });

        // 구매하기
        $("#btn-accept").on("click", e => {
            if(this.cartList.length === 0) {
                alert("장바구니에 담긴 상품이 없습니다.");
                return;
            }

            alert(`총 ${this.totalCount}개의 한지가 구매되었습니다.`);
            this.cartList.forEach(async cartItem => {
                let hasItem = await this.db.get("inventory", cartItem.id);
                if(hasItem){
                    hasItem.buyCount += cartItem.buyCount;
                    this.db.put("inventory", hasItem);
                } else {
                    this.db.add("inventory", {
                        id: cartItem.id,
                        image: cartItem.image,
                        paper_name: cartItem.paper_name,
                        width_size: cartItem.width_size,
                        height_size: cartItem.height_size,
                        count: cartItem.buyCount,
                    });
                }
                cartItem.buyCount = 0;
                cartItem.updateCart();
                cartItem.updateStore();
            });
            this.cartList = [];
            this.renderStore();
            this.renderCart();
        });
    }
}

$(function(){
    let app = new App();
});