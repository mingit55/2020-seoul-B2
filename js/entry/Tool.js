class Tool {
    constructor(workspace){
        this.selected = null;       
        this.ws = workspace;
    }       

    getXY({pageX, pageY}){
        let width = $(this.ws.canvas).width();
        let height = $(this.ws.canvas).height();
        let {left, top} = $(this.ws.canvas).offset();
        let x = pageX - left < 0 ? 0 : pageX - left > width ? width : pageX - left;
        let y = pageY - top < 0 ? 0 : pageY - top > height ? height : pageY - top;
        
        return [x, y];
    }

    getMouseTarget(e){
        let [x, y] = this.getXY(e);
        let list = this.ws.papers;
        
        for(let i = list.length - 1; i >= 0; i--){
            let paper = list[i];
            if(paper.src.getColor(x - paper.x, y - paper.y)) {
                list.push(...list.splice(i, 1));
                return paper;
            }
        }
        return null;
    }

    // 전체 선택 취소
    unselectAll(){
        this.ws.papers.forEach(paper => paper.active = false);
        this.selected = null;
    }
}