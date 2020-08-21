class Cut extends Tool {
    constructor(){
        super(...arguments);

        this.canvas = document.createElement("canvas"); // 계산용 캔버스
        this.canvas.width = this.ws.width;
        this.canvas.height = this.ws.height;
        this.ctx = this.canvas.getContext("2d");

        this.sliced = this.ws.sliced;                    // 보여주기용 캔버스(workspace)
        this.sctx = this.sliced.getContext("2d");
        this.sctx.setLineDash([5, 5]);              
        this.sctx.lineWidth = 1;
    }

    ondblclick(e){
        // 클릭한 한지 선택
        this.unselectAll();
        let target = this.getMouseTarget(e);
        if(this.selected !== target){
            this.selected = target;
            this.selected.active = true;
        }
    }

    onmousedown(e){
        // 절단선 초기화
        if(!this.selected) return;
        this.ctx.clearRect(0, 0, this.ws.width, this.ws.height);
        this.sctx.clearRect(0, 0, this.ws.width, this.ws.height);

        this.ctx.beginPath();
        this.sctx.beginPath();
    }

    onmousemove(e){
        // 절단선 그리기
        if(!this.selected) return;
        let [x, y] = this.getXY(e);

        this.sctx.lineTo(x, y);
        this.sctx.stroke();

        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        console.log(x, y);
    }
    
    oncontextmenu(makeFunc){
        if(!this.selected) return;
        makeFunc([
            {name: "자르기", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ]);
    }
    
    accept = e => {
        if(!this.selected) return;

        let newList = [];
        let selected = this.selected;
        let slicedSrc = new Source(this.ctx.getImageData(0, 0, this.ws.width, this.ws.height));
        let src = new Source( this.selected.src.imageData );
        
        // 목록에서 선택된 한지를 삭제한다.
        this.ws.papers = this.ws.papers.filter(paper => paper !== this.selected);

        // 절단선에 해당하는 좌표를 모두 비워준다.
        for(let y = 0; y < slicedSrc.height; y++){
            for(let x = 0; x < slicedSrc.width; x++){
                if(slicedSrc.getColor(x, y)){
                    src.setColor(x - selected.x, y - selected.y, [0, 0, 0, 0]);
                }
            }
        }

        // 원본 이미지를 for문으로 돌면서 검사
        for(let y = 0; y < src.height; y++){
            for(let x = 0; x < src.width; x++){
                if(!src.getColor(x, y)) continue;
                // 빈 곳은 건너뛰었으므로, 이미지가 있는 좌표에 도달함
                // => 새로운 한지 작성
                let newSrc = new Source( new ImageData(src.width, src.height) );
                
                let checkList = [ [x, y] ];
                while(checkList.length > 0){
                    let [x, y] = checkList.pop();

                    // 가장 위로 올라간 후, 내려가면서 좌우를 체크한다.
                    while(src.getColor(x, y - 1)) y--;

                    // ※ 한쪽을 한번 검사한 후 빈 공간이 나오지 않는 한 재검사 하지 않음
                    //
                    // □ ■  <- 위 while문에서 여기까지 왔다고 가정하고
                    // ■ ■  <- 여기 왼쪽은 검사하지만       (leftChecked = true)
                    // ■ ■  <- 여기는 연속되니까 검사 안하고
                    // □ ■  <- 빈 공간이 나오면 재검사 시작 (leftChecked = false)
                    // ■ ■  <- 그러므로 여기부터 재검사함   (leftChecked = false)
                    //
                    // 위 검사에서 걸린 좌표는 checkList에 들어가서 검사를 받게됨
                    // 한번 검사한 좌표는 빈 공간으로 바꾸므로 재검사하지 않음

                    let leftChecked = false;
                    let rightChcked = false;
                    do {
                        let color = src.getColor(x, y);
                        if(!color) break;
                        
                        // 새로운 한지에 색상을 옮긴 후, 원본은 빈 공간으로 채운다.
                        newSrc.setColor(x, y, color);
                        src.setColor(x, y, [0, 0, 0, 0]);
                        
                        // 왼쪽 검사
                        if(src.getColor(x - 1, y)){
                            if(leftChecked == false){
                                checkList.push([x - 1, y]);
                                leftChecked = true;
                            }
                        } else leftChecked = false;
                        
                        // 오른쪽 검사
                        if(src.getColor(x + 1, y)){
                            if(rightChcked == false){
                                checkList.push([x + 1, y]);
                                rightChcked = true;
                            }
                        } else rightChcked = false;

                    } while(src.getColor(x, ++y));
                }

                newList.push(newSrc);
            }
        }

        this.ws.papers.push(...newList.map(newSrc => {
            let newItem = new Paper(newSrc);
            // 좌표 복사
            newItem.x = this.selected.x;
            newItem.y = this.selected.y;
            
            // 절단선 복사 ( 원본 + 잘린 궤적 )
            newItem.sctx.drawImage( selected.sliced, 0, 0 );
            newItem.sctx.drawImage( this.canvas, -selected.x, -selected.y);

            // 인접한 절단선만 남김
            let sw = newItem.sliced.width;
            let sh = newItem.sliced.height;
            let slicedSrc = new Source(newItem.sctx.getImageData(0, 0, sw, sh));
            newItem.sctx.clearRect(0, 0, slicedSrc.width, slicedSrc.height);
            console.log(slicedSrc);
            for(let y = 0; y < sw; y++){
                for(let x = 0; x < sh; x++){
                    if(slicedSrc.getColor(x, y) && newItem.src.isSlicedPixel(x, y)){
                        newItem.sctx.fillRect(x, y, 1, 1);
                        console.log(x, y);
                    }
                }
            }

            // 좌표 재계산
            newItem.recalculate();

            return newItem;
        }));

        this.cancel();
    }
    
    cancel = e => {
        if(!this.selected) return;
        this.ctx.clearRect(0, 0, this.ws.width, this.ws.height);
        this.sctx.clearRect(0, 0, this.ws.width, this.ws.height);
        this.unselectAll();
    }
}