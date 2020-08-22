class Glue extends Tool {
    constructor(){
        super(...arguments);
        this.glueList = [];
    }
    
    onmousedown(e){
        let target = this.getMouseTarget(e);
        if(target){
            console.log(target, this.selected, this.selected && this.selected.isNear(target));
            // 한 개의 이미지를 선택
            if(this.selected === null){
                target.active = true;
                this.selected = target;
                this.glueList.push(target);
    
            }
            // 인접한 이미지이면서 아직 선택하지 않은 이미지를 선택
            else if(this.selected.isNear(target) && !this.glueList.includes(target)) {
                target.active = true;
                this.glueList.push(target);
            }
        } else {
            this.unselectAll();
            this.glueList = [];
        }
    }
    
    oncontextmenu(makefunc){
        if(this.glueList.length == 0) return;
        makefunc([
            {name: "붙이기", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ])
    }   

    accept = e => {
        if(this.glueList.length == 0) return;
        // 붙일 이미지들의 상하좌우 끝점을 구한다.
        let left = this.glueList.reduce((p, c) => Math.min(p, c.x), this.glueList[0].x);
        let top = this.glueList.reduce((p, c) => Math.min(p, c.y), this.glueList[0].y);
        let right = this.glueList.reduce((p, c) => Math.max(p, c.x + c.src.width-1), this.glueList[0].x + this.glueList[0].src.width-1);
        let bottom = this.glueList.reduce((p, c) => Math.max(p, c.y + c.src.height-1), this.glueList[0].y + this.glueList[0].src.height-1);
        
        // 새로운 이미지를 생성한다.
        let W = right - left + 1;
        let H = bottom - top + 1;
        let X = left;
        let Y = top;

        let newSrc = new Source( new ImageData(W, H) );
        let newItem = new Paper( newSrc );
        newItem.x = X;
        newItem.y = Y;

        
        this.glueList.forEach(glueItem => {
    
            // 절단선을 복사한다.
            newItem.sctx.drawImage( glueItem.sliced, glueItem.x - X, glueItem.y - Y );
    
            // x, y => 실제 좌표
            // nx, ny => 결과 이미지의 좌표
            // gx, gy => 병합할 이미지의 좌표
            for(let y = Y; y < Y + H; y++ ) {
                for(let x = X; x < X + W; x++){
                    let nx = x - newItem.x;
                    let ny = y - newItem.y;
    
                    let gx = x - glueItem.x;
                    let gy = y - glueItem.y;
    
                    let gc = glueItem.src.getColor(gx, gy);
                    if(gc){
                        newItem.src.setColor(nx, ny, gc);
                    }
                }
            }
        });

        newItem.recalculate();

        // 병합한 이미지는 삭제하고, 최종 결과물을 삽입한다.
        this.ws.papers = this.ws.papers.filter(paper => !this.glueList.includes(paper));
        this.ws.papers.push(newItem);
        this.cancel();
    }

    cancel = e => {
        this.glueList = [];
        this.unselectAll();
    }
}