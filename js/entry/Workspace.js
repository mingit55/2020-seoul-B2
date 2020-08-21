class Workspace {
    constructor(app){
        this.app = app;
        this.$container = $("#workspace");

        this.canvas = $("#workspace > canvas")[0];          // 공용 캔버스
        this.ctx = this.canvas.getContext("2d");

        this.sliced = document.createElement("canvas");     // 자르기용 캔버스
        this.sliced.width = this.canvas.width;
        this.sliced.height = this.canvas.height;

        this.papers = [];
        this.selectedName = null;
        this.tools = {
            select: new Select(this),
            spin: new Spin(this),
            cut: new Cut(this),
            glue: new Glue(this)
        };


        this.render();
        this.setEvents();
    }

    get selectedTool(){
        return this.tools[this.selectedName];
    }

    get width(){
        return this.canvas.width;
    }
    get height(){
        return this.canvas.height;
    }

    render(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.papers.forEach(paper => {
            paper.update();
            this.ctx.drawImage(paper.canvas, paper.x, paper.y);
            // this.ctx.strokeRect(paper.x, paper.y, paper.canvas.width, paper.canvas.height);
        });

        this.ctx.drawImage(this.sliced, 0, 0);

        requestAnimationFrame(() => this.render());
    }

    async addPaper({width, height, imageURL}){    
        let image = await new Promise(res => {
            let img = new Image();
            img.src = imageURL;
            img.onload = () => res(img);
        });

        let sx, sy, sw, sh;
        if(image.width > image.height){
            sw = image.height * width / height;
            sh = image.height;
            sx = 0;
            sy = image.height / 2 - sh / 2;
        } else {
            sw = image.width;
            sh = image.width * height / width;
            sx = image.width / 2 - sw / 2;   
            sy = 0;
        }
    
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let src = new Source(imageData);

        this.papers.push(new Paper(src));
    }    

    // 작업 영역 관련 이벤트
    setEvents(){
        $(window).on("mousedown", e => {
            if(!this.selectedTool || !this.selectedTool.onmousedown || e.which !== 1) return;
            this.selectedTool.onmousedown(e);
        });
        $(window).on("mousemove", e => {
            if(!this.selectedTool || !this.selectedTool.onmousemove || e.which !== 1) return;
            this.selectedTool.onmousemove(e);
        });
        $(window).on("mouseup", e => {
            if(!this.selectedTool || !this.selectedTool.onmouseup || e.which !== 1) return;
            this.selectedTool.onmouseup(e);
        });
        $(window).on("click", e => {
            if(!this.selectedTool || !this.selectedTool.onclick || e.which !== 1) return;
            this.selectedTool.onclick(e);
        });
        $(window).on("dblclick", e => {
            if(!this.selectedTool || !this.selectedTool.ondblclick || e.which !== 1) return;
            this.selectedTool.ondblclick(e);
        });
        $(this.canvas).on("contextmenu", e => {
            if(!this.selectedTool || !this.selectedTool.oncontextmenu) return;
            e.preventDefault();
            this.selectedTool.oncontextmenu(menus => {
                this.app.makeContextMenu(e.pageX, e.pageY, menus)
            });
        });
    }
}