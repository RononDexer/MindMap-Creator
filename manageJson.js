function readFile() {
    var input = document.getElementById("jsonUploaded");
    if (!input) {
        alert("Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
      alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
      alert("Please select a file before clicking 'Try it'");
    }
    else {
        var file = input.files[0];
        var fileReader = new FileReader();
        fileReader.onload = parseJson;
        fileReader.readAsText(file);
    }

    function parseJson(e) {
        lines = e.target.result;
        var jsonMindmap = JSON.parse(lines);
        createMindmapFromJson(jsonMindmap);
    }
}

function createMindmapFromJson(mindmap){
    var title = mindmap.title;
    alert('Ouverture de ' + title + ' en cours...');
    
    var visualization=false;
    var edition=false;

    //Création du canevas oCanvas
    var canvas = oCanvas.create({
        canvas: "#canvas",
        background: "#FFEFDB",
        fps: 60
    });

    //layout root
    var depth=getDepth(mindmap,0,0);
    diminLayout=1.3;//global
    var displaySize=getScale(depth, canvas.width);
    alert(displaySize);
    var rootWidth=canvas.width/displaySize;
    var layoutNode = canvas.display.rectangle({
        x: canvas.width / 2,
        y: canvas.height / 2,
        origin: { x: "center", y: "center" },
        width: rootWidth,
        height: rootWidth/5,
        fill: "#079",
        stroke: "10px #079",
        join: "round",
    });

    var root = new Node(title, [], [], layoutNode, canvas);
    
    
    if(edition){//pour la racine
        root.layout.bind("mousemove", function () {
            for(var j =0; j < root.children.length; j++){
                var child = root.children[j];
                child.vertexLayout.start={ x: root.layout.x, y: root.layout.y };
            }
        });
    }

    addChildrenAndLayout(root, mindmap.children, null,  canvas, visualization, edition);//TODO: appel en récursif pour tout tracer


    //affichage arbre
    drawMindmap(root,canvas,edition);
    //affichage noeud racine
    root.layout.addChild(root.titleLayout);//pour afficher texte dans noeud
    canvas.addChild(root.layout);
    if(edition){    
        var dragOptions = { changeZindex: true };
        root.layout.dragAndDrop(dragOptions);
        root.vertexLayout.dragAndDrop(dragOptions);
    }




    //animation dispo en mode visu
    if(visualization) {//verifier si le noeud a un texte court sinon afficher tout autre contenu differement
        var increase = true;
        node.bind("click tap", function () {
            if (increase) {
                increase = false;
                nodeText.text ="Display informations like :\n-url \n-video...";

                this.stop().animate({
                    x: canvas.width / 2,
                    y: canvas.height / 3,
                    height: 300,
                    width: 400,
                    rotation: 0
                });
            } else {
                increase = true;

                nodeText.text = title;
                this.stop().animate({
                    x: canvas.width / 2,
                    y: canvas.width / 3,
                    height: 40,
                    width: 200,
                    rotation: 360
                });
            }
        });
    }
}

function getDepth(nodeStart,depth,currentDepth){
    if(!(nodeStart.hasOwnProperty('children')) || nodeStart.children.length==0 ){
        if(currentDepth>depth){
            depth = currentDepth;
        }
        return depth
    }    
    for (var i=0; i < nodeStart.children.length; i++){
        currentNode=nodeStart.children[i];
        currentDepth+=1; // we go down in the tree
		depth = getDepth(currentNode,depth, currentDepth);
		currentDepth-=1; //we go up in the tree
    }
    return depth;
}

function getScale(depth, canvasWidth){
    var displaySize= 4.7;//hierOneDisplaySize 
    for (var i=0; i < depth-2; i++){
        displaySize+=displaySize/Math.pow(diminLayout,4);
    }
    return displaySize;
}

function collisionExist(layout, point){
    if(point.x<layout.x+(layout.width/2) && point.x>layout.x-(layout.width/2)){
        if(point.y<layout.y+(layout.height/2) && point.y>layout.y-(layout.height/2)){
            return true;
        }
    }
    return false;
}

function collisionExistBetweenLayouts(layout1, layout2){
    //check if each of the 4 coins of the rectangle layout1 is in layout2
    //first corner : top right and then clockwise
    for(var i=0; i<4; i++){
        var point={x:0, y:0};
        if(i==0 || i==1){
            point.x=layout1.x+layout1.width/2;
        }
        if(i==2 || i==3){
            point.x=layout1.x-layout1.width/2;
        }
        if(i==0 || i==3){
            point.y=layout1.y+layout1.height/2;
        }        
        if(i==1 || i==2){
            point.y=layout1.y-layout1.height/2;
        }
        returnVal= collisionExist(layout2, point);
        if (returnVal){
            return true;
        }
    }
    return false;
}

/*
*father is the father of the caculatedNode
*return 0 if no collision
*return 1 if collision is strong in x
*return 2 if collision is strong in y
*/
function externalCollisionExist(calculatedLayout, treeWthLayout, father){
    var nbSons=treeWthLayout.children.length;
    for(var i =0; i < nbSons; i++){
        var child=treeWthLayout.children[i];
        var colExist=collisionExistBetweenLayouts(calculatedLayout,child.layout);
        if(colExist){
            var deltaX=Math.abs(calculatedLayout.x-child.x);
            var deltaY=Math.abs(calculatedLayout.y-child.y);
            if (deltaX>deltaY){
                return 1;
            }
            return 2;
        }   
        if(!Object.is(child,father)){//tester Object.is(treeWthLayout,father) pour détecter aussi les collisions internes
            var returnVal=externalCollisionExist(calculatedLayout, child, father);
            if (returnVal==1 || returnVal==2){
                return returnVal;
            }
        }
    }
    return 0;
}

function addChildrenAndLayout(currentNode, childrenData, root, canvas, visualization, edition){
    var nbSons = childrenData.length;
    var layout = currentNode.layout;
    var rayon = layout.width;
    var pi = Math.PI;
    for (var i =0; i < nbSons; i++){
        // Chaque point sur le cercle a pour coordonnées : Mk ( cos(k .2Pi/n) , sin(k .2Pi/n) )
        var positionX  = layout.x + rayon*Math.cos(i*2*(pi/nbSons))*1.9;
        var positionY  = layout.y + rayon*Math.sin(i*2*(pi/nbSons));
        //si ce n'est pas la racine : reduire le trace des fils
        var calculatedLayout={x:positionX, y:positionY, width:layout.width/diminLayout, height:layout.height/diminLayout};
        if(root){
            var rootLayout=root.layout;
            var deltaX=layout.x-rootLayout.x;
            var deltaY=rootLayout.y-layout.y;
            var beginPoint=0;
            var nbPtsForAllCircle=(nbSons-1)*4//si on considere 1/4 de cercle
            if (nbSons==1){
                 nbPtsForAllCircle=4;
            }
            if(deltaX>0+rootLayout.height && deltaY<0-rootLayout.height){//positionner sur le quart droit inferieur
                beginPoint=0;
            }
            else if((deltaX<0+rootLayout.height && deltaX>0-rootLayout.height) && deltaY<0-rootLayout.height){//positionner sur le quart en bas
                beginPoint=0.125;
            }
            else if(deltaX<0-rootLayout.height && deltaY<0-rootLayout.height){//positionner sur le quart gauche inferieur
                beginPoint=0.25;
            }
            else if( deltaX<0-rootLayout.height && (deltaY<0+rootLayout.height && deltaY>0-rootLayout.height) ){//positionner sur le quart a gauche
                beginPoint=0.375;
            }
            else if(deltaX<0-rootLayout.height  && deltaY>0+rootLayout.height){//positionner sur le quart gauche superieur
                beginPoint=0.5;
            }
            else if( (deltaX<0+rootLayout.height && deltaX>0-rootLayout.height) && deltaY>0+rootLayout.height){//positionner sur le quart en haut
                beginPoint=0.625;
            }
            else if(deltaX>0+rootLayout.height && deltaY>0+rootLayout.height){//positionner sur le quart droit superieur
                beginPoint=0.75;
            }
            else if(deltaX>0+rootLayout.height && (deltaY<0+rootLayout.height && deltaY>0-rootLayout.height)){//positionner sur le quart a droite
                beginPoint=0.875;
            }
            beginPoint*=nbPtsForAllCircle;
            if (nbSons==1){
                beginPoint+=0.5;
            }
            var ratioLayout=layout.width/rootLayout.width;
            calculatedLayout.x = layout.x + rayon*Math.cos((beginPoint+i)*2*pi/nbPtsForAllCircle)*(1+Math.pow(ratioLayout,3));
            calculatedLayout.y = layout.y + rayon*Math.sin((beginPoint+i)*2*pi/nbPtsForAllCircle);
            var colExist=externalCollisionExist(calculatedLayout, root, currentNode);
            var calls=1;
	        while (colExist!=0 && calls<4){//il faut rapprocher le noeud
	            if(colExist==1){
    	            calculatedLayout.x = layout.x+(calculatedLayout.x-layout.x)*0.8;
	            }
	            else{
                    calculatedLayout.y = layout.y+(calculatedLayout.y-layout.y)*0.8;
                }
                calls+=1;
                colExist=externalCollisionExist(calculatedLayout, root, currentNode);
	        }
        }
        
        var childTitle = childrenData[i].title;
        var strokeSize=0.05*layout.width/diminLayout;
        var childLayout = layout.clone({ width: layout.width/diminLayout,  height: layout.height/diminLayout , x: calculatedLayout.x, y: calculatedLayout.y, fill: "#29b", stroke: strokeSize+"px #29b" });
        
        var child = new Node(childTitle, [], [], childLayout, canvas);
        currentNode.addChild(child, canvas);

        //animation dispo en mode visu
        if(visualization){//pour les fils
            child.layout.bind("click tap", function () {
                if (increase) {
                    increase = false;

                    //nodeChildText.text = "Informations";
                    this.stop().animate({
                        x: node.x + tableau6X[i],
                        y: node.y + tableau6Y[i],
                        height: 300,
                        width: 400,
                        rotation: 360
                    });
                } else {
                    increase = true;

                    //nodeChildText.text = child1;

                    this.stop().animate({
                        x: node.x + tableau6X[i],
                        y: node.y + tableau6Y[i],
                        height: node.height/1.2,
                        width: node.width/1.2,
                        rotation: 0
                    });
                }
            });
        }    
    }
    if(!root){
        root=currentNode;
    }
    for(var i=0;i < nbSons;i++){
		var child=currentNode.children[i];
		childData=childrenData[i];
		if ( childData.hasOwnProperty('children') ){
			addChildrenAndLayout(child, childData.children, root, canvas, visualization, edition);
		}
	}  
}

function drawMindmap(currentNode,canvas,edition) {
    var nbSons = currentNode.children.length;
    var dragOptions = { changeZindex: true };
    for (var i =0; i < nbSons; i++){
        var child = currentNode.children[i];
        drawMindmap(child,canvas,edition);
        canvas.addChild(child.vertexLayout);
        child.layout.addChild(child.titleLayout);//pour afficher texte dans noeud
        canvas.addChild(child.layout);
        if(edition){
            child.layout.dragAndDrop(dragOptions);
            child.vertexLayout.dragAndDrop(dragOptions);
        }

        if(edition){//pour les fils
            child.layout.bind("mousemove", function () {
                for(var j =0; j < child.children.length; j++){
                    var grandSon = child.children[j];
                    grandSon.vertexLayout.start={ x: child.layout.x, y: child.layout.y };
                }
                child.vertexLayout.end={ x: child.layout.x, y: child.layout.y };
            });
        }
    }
}
