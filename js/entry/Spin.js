class Spin extends Tool {
    constructor(){
        super(...arguments);
    }

    ondblclick(e){
        let target = this.getMouseTarget(e);

        if(target && this.selected == null){
            target.active = true;
            target.recalculate();

            this.selected = target;
            this.prevImage = target.src;
            this.prevSliced = target.sliced;

            // 회전할 이미지를 캔버스에 담는다.
            this.image = document.createElement("canvas");
            this.image.width = target.src.width;
            this.image.height = target.src.height;
            let ictx = this.image.getContext("2d");
            ictx.putImageData(target.src.imageData, 0, 0);

            // 회전할 절단선을 캔버스에 담는다.
            this.sliced = document.createElement("canvas");
            this.sliced.width = target.src.width;
            this.sliced.height = target.src.height;
            let sctx = this.image.getContext("2d");
            sctx.drawImage(target.sliced, 0, 0);

            // 사이즈 및 좌표를 재계산한다.
            let [,, imgW, imgH] = target.src.getImageSize();
            let wantSize = parseInt(Math.sqrt(Math.pow(imgW, 2) + Math.pow(imgH, 2)));
            let moveX = parseInt((wantSize - imgW) / 2);
            let moveY = parseInt((wantSize - imgH) / 2);
            
            // 선택된 대상의 캔버스를 회전 가능한 사이즈로 확장한다.
            target.canvas.width = target.canvas.height = wantSize;
            target.sliced.width = target.sliced.height = wantSize;
            target.x = parseInt(target.x - moveX);
            target.y = parseInt(target.y - moveY);
            
            // 회전용 캔버스를 생성한다.
            this.canvas = document.createElement("canvas");
            this.canvas.width = this.canvas.height = wantSize;
            this.ctx = this.canvas.getContext("2d");

            // 회전용 캔버스에 이미지를 뿌린 후 저장한다.
            let imgX = wantSize / 2 - this.prevImage.width / 2;
            let imgY = wantSize / 2 - this.prevImage.height / 2;
            this.ctx.drawImage(this.image, imgX, imgY);
            target.src = new Source( this.ctx.getImageData(0, 0, wantSize, wantSize) );

            // 회전용 캔버스에 절단선을 뿌린 후 저장한다.
            target.sctx.clearRect(0, 0, target.wantSize, target.wantSize);
            target.sctx.drawImage(target.sliced, imgX, imgY);
        }
    }

    onmousedown(e){
        if(!this.selected) return false;
        this.beforeX = e.pageX;
    }

    onmousemove(e){
        if(!this.selected) return false;
        // 회전할 각도를 계산한다.
        let x = e.pageX;
        let arrow = x > this.beforeX ? -5 : 5;
        let angle = Math.PI * arrow / 180;
        this.beforeX = x;

        // 중심점을 계산한다.
        let center = this.canvas.width / 2
        let imgX = center - this.prevImage.width / 2;
        let imgY = center - this.prevImage.height / 2;       

        // 회전용 캔버스를 회전시킨다.
        this.ctx.translate(center, center);
        this.ctx.rotate(angle);
        this.ctx.translate(-center, -center);
        
        // 이미지를 뿌린 후 저장한다.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, imgX, imgY);
        this.selected.src = new Source( this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height) );

        // 절단선을 뿌린 후 저장한다.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.sliced, imgX, imgY);
        this.selected.sctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.selected.sctx.drawImage(this.canvas, 0, 0);
    }

    oncontextmenu(makeFunc){
        if(!this.selected) return;
        makeFunc([
            {name: "확인", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ]);
    }

    accept = e => {
        if(!this.selected) return;
        this.selected.recalculate();
        this.unselectAll();
    };

    cancel = e => {
        if(!this.selected) return;

        // 좌표 되돌리기
        let moveX = (this.canvas.width - this.prevImage.width) / 2;
        let moveY = (this.canvas.height - this.prevImage.height) / 2;
        this.selected.x += moveX;
        this.selected.y += moveY;

        // 크기 되돌리기
        this.selected.canvas.width = this.prevImage.width;
        this.selected.canvas.height = this.prevImage.height;

        // 이미지 & 절단선 되돌리기
        this.selected.src = this.prevImage;
        this.selected.sliced = this.prevSliced;

        // 이미지 재계산
        this.selected.recalculate();
        this.unselectAll();
    }
}