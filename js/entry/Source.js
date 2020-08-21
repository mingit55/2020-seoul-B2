class Source {
    constructor(imageData){
        this.imageData = imageData;
        this.borderColor = [255, 0, 0];
        this.borderData = this.getBorderData();
    }

    get data(){
        return this.imageData.data;
    }    
    get width(){
        return this.imageData.width;
    }
    get height(){
        return this.imageData.height;
    }

    // 테두리 만들기
    getBorderData(){
        let uint8 = new Uint8ClampedArray(this.data);
        
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width ; x++){
                if(this.isBorderedPixel(x, y)){
                    let i = x * 4 + y * 4 * this.width;
                    // 테두리 색상
                    uint8[i] = this.borderColor[0];
                    uint8[i+1] = this.borderColor[1];
                    uint8[i+2] = this.borderColor[2];
                    uint8[i+3] = 255;
                }
            }
        }

        return new ImageData(uint8, this.width, this.height);
    }

    // 색상 가져오기
    getColor(x, y){
        if(0 <= x && x < this.width && 0 <= y && y < this.height){
            let i = x * 4 + y * 4 * this.width;
            let r = this.data[i];
            let g = this.data[i+1];
            let b = this.data[i+2];
            let a = this.data[i+3];
            return a == 0 ? null : [r, g, b, a];
        }
        return null;
    }

    // 색상 바꾸기
    setColor(x, y, [r, g, b, a = 255]){
        if(0 <= x && x < this.width && 0 <= y && y < this.height){ 
            let i = x * 4 + y * 4 * this.width;
            this.data[i] = r;
            this.data[i+1] = g;
            this.data[i+2] = b;
            this.data[i+3] = a;
        }
    }

    // 여백을 제외한 실제 사이즈 가져오기
    getImageSize(){
        let top = this.height;
        let left = this.width;
        let bottom = 0;
        let right = 0;
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.getColor(x, y)){
                    top    = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                    left   = Math.min(left, x);
                    right  = Math.max(right, x);
                }
            }
        }
        return [left, top, right - left, bottom - top];
    }

    // 해당 좌표가 테두리에 속하는 지
    isBorderedPixel(x, y){
        return this.getColor(x, y) &&
              (!this.getColor(x - 1, y)
            || !this.getColor(x + 1, y)
            || !this.getColor(x, y - 1)
            || !this.getColor(x, y + 1));
    }

    //   
}