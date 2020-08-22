class Paper {
    constructor(source){
        this.x = 0;
        this.y = 0;
        this.active = false;        
        this.src = source;
        
        this.canvas = document.createElement("canvas");    // 공용 캔버스
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;
        this.ctx = this.canvas.getContext("2d");        

        this.sliced = document.createElement("canvas");     // 절단선 캔버스
        this.sliced.width = this.src.width;
        this.sliced.height = this.src.height;
        this.sctx = this.sliced.getContext("2d");
    }   

    // 모든 캔버스 업데이트
    update(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 활성화 => 테두리가 있는 이미지
        // 비활성화 => 테두리가 없는 이미지
        if(this.active) 
            this.ctx.putImageData(this.src.borderData, 0, 0);
        else 
            this.ctx.putImageData(this.src.imageData, 0, 0);

        // 절단선을 가장 나중에 그려줌
        this.ctx.drawImage(this.sliced, 0, 0);
    }

    // 인수로 받은 한지와 인접한지의 여부
    isNear(paper){
        for(let y = this.y; y < this.y + this.src.height; y++){
            for(let x = this.x; x < this.x + this.src.width; x++){
                let tx = x - this.x;
                let ty = y - this.y;

                let ax = x - paper.x;
                let ay = y - paper.y;

                
                if(this.src.getColor(tx, ty) && paper.src.getColor(ax, ay))
                    return true;
            }
        }
        return false;
    }

    // 이미지의 실제 사이즈에 맞춰 재계산
    recalculate(){
        // 실제 위치 & 사이즈대로 데이터를 복사한다.
        let [X, Y, W, H] = this.src.getImageSize();

        if(W == 0 || H == 0) return false;

        let uint8 = new Uint8ClampedArray(W * H * 4);
        for(let y = Y; y < Y + H; y++){
            for(let x = X; x < X + W; x++){
                let color = this.src.getColor(x, y);
                if(color){
                    let i = (x - X) * 4 + (y - Y) * 4 * W;
                    uint8[i] = color[0];
                    uint8[i+1] = color[1];
                    uint8[i+2] = color[2];
                    uint8[i+3] = color[3];
                }
            }
        }
        let imageData = new ImageData(uint8, W, H);
        this.src = new Source( imageData );

        // 공용 캔버스의 위치와 사이즈를 맞춰준다.
        this.canvas.width = W;
        this.canvas.height = H;
        this.x += X;
        this.y += Y;

        // 테두리를 다시 계산한다.
        this.src.borderData = this.src.getBorderData();

        // 절단선 캔버스의 위치와 사이즈를 맞춰준다.
        let slicedData = this.sctx.getImageData(0, 0, this.sliced.width, this.sliced.height);
        this.sliced.width = W;
        this.sliced.height = H;
        this.sctx.clearRect(0, 0, W, H);
        this.sctx.putImageData(slicedData, -X, -Y);

        // 인접한 절단선만 남긴다
        let sw = this.sliced.width;
        let sh = this.sliced.height;
        let slicedSrc = new Source(this.sctx.getImageData(0, 0, sw, sh));
        this.sctx.clearRect(0, 0, slicedSrc.width, slicedSrc.height);
        for(let y = 0; y < sw; y++){
            for(let x = 0; x < sh; x++){
                if(slicedSrc.getColor(x, y) && this.src.isSlicedPixel(x, y)){
                    this.sctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // slicedData = this.sctx.getImageData(0, 0, W, H).data;
        // this.sctx.clearRect(0, 0, W, H);

        // let tempColor = [];
        // Array.from(slicedData)
        //     .forEach((color, i) => {
        //         tempColor.push(color);
        //         if(tempColor.length === 4){
        //             let x = Math.floor(i / 4) % W;
        //             let y = Math.floor((i / 4) / W);
        //             if(tempColor[3] !== 0 && this.src.isBorderedPixel(x, y)){
        //                 this.sctx.fillRect(x, y, 1, 1);
        //             }
        //             tempColor = [];
        //         }
        //     });

        return true;
    }
}