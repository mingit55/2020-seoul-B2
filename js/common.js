class IDB {
    constructor(dbname, storeNames = [], callback = () => {}){
        let req = indexedDB.open(dbname, 1);
        req.onupgradeneeded = () => {
            let conn = req.result;
            storeNames.forEach(storeName => {
                conn.createObjectStore(storeName, {keyPath: "id", autoIncrement: true});
            });
        };
        req.onsuccess = () => {
            this.conn = req.result;
            callback(this);
        };
    }
    
    getObjectStore(storeName){
        return this.conn.transaction(storeName, "readwrite").objectStore(storeName);
    }

    get(storeName, id){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.get(id);
            req.onsuccess = () => res(req.result);
        });
    }

    getAll(storeName){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.getAll();
            req.onsuccess = () => res(req.result);
        });
    }

    add(storeName, object){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.add(object);
            req.onsuccess = () => res(req.result);
        });
    }

    put(storeName, object){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.put(object);
            req.onsuccess = () => res(req.result);
        });
    }

    delete(storeName, id){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.delete(id);
            req.onsuccess = () => res(req.result);
        });
    }
}

class HashModule {
    constructor(rootSelector, examList = []){
        this.$root = $(rootSelector);
        this.name = this.$root.data("name");    // input에 등록할 이름
        this.hasExamples = [];                  // 가지고 있는 예시목록
        this.showExamples = [];                 // 보여주고 있는 예시목록
        this.tags = [];                         // 사용자가 입력한 해시태그
        this.focusIndex = null;                 // 활성화된 예시 인덱스

        examList.forEach(item => {
            !this.hasExamples.includes(item) && this.hasExamples.push(item);
        });
        
        this.init();
        this.setEvents();
    }

    get $container(){
        return this.$root.find(".hash-module");
    }
    get $message(){
        return this.$root.find(".hash-module__message");
    }
    get $input(){
        return this.$root.find(".hash-module__input > input");
    }
    get $examList(){
        return this.$root.find(".example-list");
    }

    // 초기 DOM 구축
    init(){
        this.$root.html(`<div class="hash-module">
                            <input type="hidden" id="tags-value" name="${this.name}">
                            <div class="hash-module__input">
                                <input type="text" placeholder="추가할 태그를 입력하세요">
                                <div class="example-list"></div>
                            </div>
                        </div>
                        <div class="hash-module__message"></div>`);
    }

    // DOM 렌더링
    render(){
        this.$root.find(".hash-module__item").remove();
        this.$root.find("#tags-value").val(JSON.stringify(this.tags));
        this.$examList.html(`${this.showExamples.map((item, i) => `<div class="example-list__item ${i == this.focusIndex ? 'active' : ''}" data-idx="${i}}"># ${item}</div>`).join('')}`);
        this.tags.forEach(tag => {
            this.$container.append(`<span class="hash-module__item">#${tag}<button class="remove">&times;</button></span>`);
        });
    }

    // 태그 추가하기
    pushTag(text){
        // 입력 문자가 2 ~ 30자 이내가 아닐 떄
        if(text.length < 2 || 30 < text.length) return;
        // 이미 등록된 태그를 입력할 때
        if(this.tags.includes(text)){
            this.$message.text("이미 추가한 태그입니다.");
            return;
        }
        // 이미 추가된 태그가 10개 이상일 때
        if(this.tags.length >= 10) {
            this.$message.text("태그는 10개까지만 추가할 수 있습니다.");
            return;
        }
        this.tags.push(text);
        this.render();
        this.$input.val("");
        this.$input.focus();
    }

    // 이벤트 작성
    setEvents(){
        // 입력 문자, 길이 제한
        this.$root.on("input", "input", e => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]/g, "").substr(0, 30);
            this.focusIndex = null;
            this.$message.text("");
            this.render();
        });

        // Enter, Tab, Spacebar 외 다른 키를 입력할 때
        this.$root.on("keydown", "input", e => {
            if(![13, 32, 9].includes(e.keyCode)) return;
            e.preventDefault();

            // 예시 목록 중 등록
            if(this.focusIndex !== null && e.keyCode === 13){
                let text = this.showExamples[this.focusIndex];
                this.focusIndex = null;
                this.showExamples = [];
                this.pushTag(text);
            }
            // 일반 등록
            else {
                this.pushTag(e.target.value);
            }
        });

        // 해시태그 삭제
        this.$root.on("click", ".remove", e => {
            let text = e.target.parentElement.innerText;
            text = text.substr(1, text.length - 2);

            this.tags = this.tags.filter(tag => tag !== text);
            this.render();
        });

        // 예시 목록 보여주기
        this.$root.on("input", "input", e => {
            let searchRegex = this.$input.val() != "" ? new RegExp("^" + this.$input.val().replace(/[\^\$.*+?\[\]\(\)\\\\\\/]/g ,"")) : /^$/;
            this.showExamples = this.hasExamples.filter(item => searchRegex.test(item));
            this.render();
        });


        // 예시 목록 선택하기
        this.$root.on("click", ".example-list__item", e => {
            this.focusIndex = parseInt(e.currentTarget.dataset.idx);
            this.render();
            this.$input.focus();
        });
        this.$root.on("keydown", "input", e => {
            if(![38, 40].includes(e.keyCode)) return;
            e.preventDefault();
            // 첫 입력 
            if(this.focusIndex === null){
                this.focusIndex = 0;
            }
            // 위
            else if(e.keyCode === 38){
                this.focusIndex = this.focusIndex - 1 < 0 ? this.showExamples.length - 1 : this.focusIndex - 1;
            }
            // 아래
            else if(e.keyCode === 40) {
                this.focusIndex = this.focusIndex + 1 > this.showExamples.length - 1 ? 0 : this.focusIndex + 1;
            }
            this.render();
        });

        // 예시목록 감추기
        this.$root.on("blur", "input", e => {
            console.log("blur");
            this.showExamples = [];
            this.render();
        });
    }
}

$(function(){

});