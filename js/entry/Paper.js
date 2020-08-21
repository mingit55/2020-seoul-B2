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

        // 공용 캔버스의 사이즈를 실사이즈에 맞춰준다.
        this.canvas.width = W;
        this.canvas.height = H;
        this.x += X;
        this.y += Y;

        
        // 절단선 캔버스도 함께 위치와 사이즈를 맞춰준다.
        let slicedData = this.sctx.getImageData(0, 0, this.sliced.width, this.sliced.height);
        this.sliced.width = W;
        this.sliced.height = H;
        this.sctx.clearRect(0, 0, W, H);
        this.sctx.putImageData(slicedData, -X, -Y);

        return true;
    }
}