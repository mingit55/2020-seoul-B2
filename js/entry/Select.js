class Select extends Tool {
    constructor(){
        super(...arguments);
    }

    // 클릭한 한지 선택
    onmousedown(e){
        this.unselectAll();
        let target = this.getMouseTarget(e);

        if(target) {
            this.downXY = this.getXY(e);
            this.beforeXY = [target.x, target.y];
            this.selected = target;
            target.active = true;
        }
    }

    // 이전 좌표에서 마우스를 움직인 만큼 좌표 재배치
    onmousemove(e){
        if(this.selected){
            let [x, y] = this.getXY(e);
            let [dx, dy] = this.downXY;
            let [bx, by] = this.beforeXY;
            
            this.selected.x = bx + x - dx;
            this.selected.y = by + y - dy;
        }
    }
}