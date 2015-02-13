function getNodeById(currentNode, ident){
    if(currentNode.ident==ident){
        return currentNode;
    }
    for(var i=0; i<currentNode.children.length ; i++){
        var son = currentNode.children[i];
        var returnVal=getNodeById(son, ident);
        if(returnVal){
            return returnVal;
        }
    }
    return null;
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
    var displaySize= 0;
    for (var i=0; i <= depth; i++){
        displaySize+=1/Math.pow(diminLayout,i);
    }
    return displaySize*2.8;
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

function addChildrenAndLayout(currentNode, childrenData){
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
        if(currentNode.ident!=root.ident){
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
        var childLayout = canvas.display.rectangle({ 
            x: calculatedLayout.x, 
            y: calculatedLayout.y, 
            origin: { x: "center", y: "center" },
            width: layout.width/diminLayout, 
            height: layout.height/diminLayout, 
            fill: "#29b", 
            stroke: strokeSize+"px #29b",
            join : "round"            
        });
        
        var child = new Node(childTitle, [], [], childLayout, canvas);
        currentNode.addChild(child, canvas);
    }
    for(var i=0;i < nbSons;i++){
        var child=currentNode.children[i];
        childData=childrenData[i];
        if ( childData.hasOwnProperty('children') ){
            addChildrenAndLayout(child, childData.children);
        }
    }  
}

//code function drawMindMap

function drawMindmap(currentNode,root,canvas,edition) {
    var nbSons = currentNode.children.length;
    var dragOptions = { changeZindex: true };
    for (var i =0; i < nbSons; i++){
        var child = currentNode.children[i];
        drawMindmap(child,root,canvas,edition);
        canvas.addChild(child.vertexLayout);
        child.layout.addChild(child.titleLayout);//pour afficher texte dans noeud
        canvas.addChild(child.layout);
        if(edition){
            child.layout.dragAndDrop(dragOptions);
        }
        if(edition){//pour les fils
            child.layout.bind("mousemove", function () {
                var clickedNode=getNodeById(root,this.ident);
                for(var j =0; j < clickedNode.children.length; j++){
                    var son = clickedNode.children[j];
                    son.vertexLayout.start={ x: this.x, y: this.y };
                }
                clickedNode.vertexLayout.end={ x: this.x, y: this.y };
            });
        }
    }
}

function addContents(currentNode, data){
    for (var i =0; i < data.contents.length; i++){
        var dataContent = data.contents[i];
        var currentContent=new Content(dataContent.type,dataContent.information)
        currentNode.addContent(currentContent);
    }
    //recursive call
    for (var i =0; i < currentNode.children.length; i++){
	    addContents(currentNode.children[i],data.children[i]);
    }
}


function getFather(node,currentNode){
    for(var i =0; i < currentNode.children.length; i++){
        if(currentNode.children[i].ident==node.ident){
            return currentNode;
        }
    }
    for(var i =0; i < currentNode.children.length; i++){
        var father = getFather(node, currentNode.children[i]);
        if(father){
            return father;
        }
    }
}

function addChildToNode(relatedNode){
    for(var i =0; i < relatedNode.children.length; i++){
        deleteNodeLayout(relatedNode.children[i]);
    }
    var newChildData = {title:"new Node"};
    var childrenData=relatedNode.children;
    childrenData.push(newChildData);
    relatedNode.children=[];
    //remove link between text and layout
    relatedNode.layout.removeChild(relatedNode.titleLayout);
    //recaculate children's layout
    addChildrenAndLayout(relatedNode, childrenData, root, canvas);
    drawMindmap(relatedNode,root,canvas,edition);//draw
    //relink text and layout
    relatedNode.layout.addChild(relatedNode.titleLayout);
    //put node above vertex
    canvas.removeChild(relatedNode.layout);
    canvas.addChild(relatedNode.layout);
    //link node edition 
    for(var i =0; i < relatedNode.children.length; i++){
        bindNodesEdition(relatedNode.children[i],root); 
        bindNodesMouseMove(relatedNode.children[i],root); 
    }
    canvas.redraw();
}

function deleteNodeLayout(relatedNode){
    for(var i =0; i < relatedNode.children.length; i++){
        deleteNodeLayout(relatedNode.children[i]);
    }
    //make sure there are no buttons left on the node
    if(relatedNode.layout.addButton){
        canvas.removeChild(relatedNode.layout.addButton);
        relatedNode.addButton = undefined; 
    }
    if(relatedNode.layout.delButton){
        canvas.removeChild(relatedNode.layout.delButton);
        relatedNode.delButton = undefined;
    }
    //delete layout
    if(relatedNode.ident!=root.ident){
        canvas.removeChild(relatedNode.vertexLayout);
    }
    canvas.removeChild(relatedNode.layout);
}

function saveNode(){
    var nodeToChange=getNodeById(root,lastNodeClickedId);
    saveNodeName(nodeToChange);
    saveNodeContent(nodeToChange);
}

function saveNodeName(nodeToChange){
    var newText=document.getElementById('newTextValue').value;
    if(newText!="" && newText!=nodeToChange.title){
            nodeToChange.setTitle(newText);
            canvas.redraw();
    }
}

function saveNodeContent(nodeToChange){
    var newContents = document.getElementById('nodeContent').value;
    var newContentsText = newContents.split("\n");
    nodeToChange.contents=[];
    for (var i=0;i<newContentsText.length;i++){
        var contentTag = newContentsText[i].split(":")[0].split(" ");
	    var currentContent;
        if(contentTag=="img"){
        	var contentSplit = newContentsText[i].split(":");
        	var contentInfo=contentSplit.slice(1,contentSplit.length).join(":");
        	currentContent = new Content("picture",contentInfo);
        }
        else{
        	currentContent = new Content("text",newContentsText[i]);
        }
        nodeToChange.addContent(currentContent);
    }
}

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

function saveMindMap(){
    seen=[];
    function simplifyAttrib(key, value) {
        if( key && !isInt(key) && !( key=="title" || key=="contents" || key=="children" || key=="information" || key=="type") ){
            return undefined;
        }
        if (value != null && typeof value == "object"){
            if (seen.indexOf(value) >= 0)
                return
            seen.push(value);
        }
        return value;
    }

    var jsonToWrite= JSON.stringify(root, simplifyAttrib);
    saveTextAsFile(jsonToWrite,"mindMapSaved.json");
}


function saveTextAsFile(textToWrite, nameFile)
{
    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    var fileNameToSaveAs = nameFile;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null)
    {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else
    {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}

function loadFileAsText()
{
    var fileToLoad = document.getElementById("fileToLoad").files[0];

    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent) 
    {
            var textFromFileLoaded = fileLoadedEvent.target.result;
            document.getElementById("inputTextToSave").value = textFromFileLoaded;
    };
    fileReader.readAsText(fileToLoad, "UTF-8");
}

function handleFreeMindAttributes(treeFreeMind){
    if(Array.isArray(treeFreeMind)){//children list
        for(var i =0; i < treeFreeMind.length; i++){
            treeFreeMind[i]=handleFreeMindAttributes(treeFreeMind[i]);
        }
        return treeFreeMind;
    }
    else if(treeFreeMind.hasOwnProperty('node')){//current node
        var children=handleFreeMindAttributes(treeFreeMind.node);
        if(!Array.isArray(children)){
            children=[children];
        }
        return {title:treeFreeMind["@attributes"]["TEXT"], children:children};
    }
    else{//leaf
        return {title:treeFreeMind["@attributes"]["TEXT"]};
    }
}