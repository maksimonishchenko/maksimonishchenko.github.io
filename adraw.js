    var url = '/uploads/';
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

    var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1,
    canvas = document.getElementById('pdfpad1'),
    ctx = canvas.getContext('2d');

    var drawcanvas; 


    function clearSign() 
    {
        if(drawcanvas != null) drawcanvas.clear(); 
    }

    function init(w,h)
    {
       if(drawcanvas != null)
       {
          return;
       }

       drawcanvas = new fabric.Canvas('skt1', {isDrawingMode:true,width:w,height:h});
      
       drawcanvas.setDimensions({width:w,height:h},{cssOnly:true});
       canvas.style.width =w.toString()+"px";
       canvas.style.height = h.toString()+"px";
       fabric.Object.prototype.transparentCorners = false;
       
       $("#prev").on("touchstart click", function(event) {
         event.preventDefault();
         if (pdfDoc == null || pageNum <= 1) {
           return;
         }
         clearSign();
         pageNum--;
         queueRenderPage(pageNum);
       });

       $("#next").on("touchstart click", function(event) {
         event.preventDefault(); 
         if (pdfDoc == null || pageNum >= pdfDoc.numPages) {
           return;
         }
         clearSign();
         pageNum++;
         queueRenderPage(pageNum);
       });
       drawcanvas.on('object:added', function(event)
       {
         if(drawcanvas.getObjects().length < 1)
         {
             alert('No sign');	 
             return;    
         }
         var inputEl = document.getElementById("fileToUpload"); 
         var pdfpad1 = document.getElementById('pdfpad1');
         var ctx = pdfpad1.getContext('2d');
         var fPathInp = convertInputValueToPath(inputEl.value);

         var svgBlob = new Blob([drawcanvas.toSVG()], {type: 'application/octet-stream'});
         var a = document.createElement("a");
         var urlSVG = URL.createObjectURL(svgBlob);

         a.href = urlSVG;
         a.download = pageNum + "sign.SVG";
         document.body.appendChild(a);
         a.click();
	 	 $.ajax(
	         {
	            type: "POST",
	            url: "/topdf.py",
	            data: {svg : drawcanvas.toSVG()},
	            dataType: "image/svg+xml",
	            success: function (html)
	            {
	                alert('html' + html);
	            },
	            error: function(request, ajaxOptions, thrownError)
	            {
	                var file = new Blob([request.responseText], {type: 'text/plain'});
	                var reader = new FileReader();
	                reader.onloadend = function(e) 
	                {
	                    pdfjsLib.getDocument(reader.result).promise.then(function(pdfDoc_) {
	                        pdfDoc = pdfDoc_;
	                        pdfDoc.getPage(1).then(function(page) {
	                                var viewport = page.getViewport({scale:scale});
	                                var renderContext = {
	                                  canvasContext: ctx,
	                                  viewport: viewport,
	                                  background: 'rgba(0,0,0,0)'
	                                };
	                                var renderTask = page.render(renderContext);
	
	                                renderTask.promise.then(function() {
	                                        drawcanvas.clear();
	                                        var imgData = ctx.canvas.toDataURL('image/png');
	                                        var hashCode = Array.from(imgData).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)
	                                        var doc = new jsPDF('p', 'mm',[drawcanvas.width,drawcanvas.height]);
	                                        doc.addImage(imgData,'PNG',0,0);
	                                        doc.save(hashCode+".pdf");
	                                });
	                         });
	                    });  
	                }
	                reader.readAsDataURL(file);
	            }
	         });
       });
    }

    function download(data, filename, type) {
        var file = new Blob([data], {type: type});
        var a = document.createElement("a");
        var url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
    }

    function convertInputValueToPath(fullPath)
    {
       var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
       var filename = fullPath.substring(startIndex);
       if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) 
       {
            filename = filename.substring(1);
       }
       return filename;
    }
    
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: scale});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    var renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      background: 'rgba(0,0,0,0)'
    };
    var renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
      else
      {
        init(canvas.width,canvas.height);
      }
    });
  });
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
  pdfDoc = pdfDoc_;
  renderPage(pageNum);
});

function readInput(input) {
  if (input.files && input.files[0]) {
    readURL(input.files[0],pageNum);
  }
}

function readURL(url,page) {
    var reader = new FileReader();
    if(url.name.includes("SVG"))
    {
	reader.onloadend = function(e) 
	{
	 	clearSign();
	        fabric.loadSVGFromString(reader.result, function(objects, options) {
	          var obj = fabric.util.groupSVGElements(objects, options);
	          drawcanvas.add(obj).renderAll();
	        });
	}
        if (pdfDoc == null) return
        else reader.readAsText(url); 
    }
    else
    {
  	reader.onloadend = function(e) 
  	{
		pdfjsLib.getDocument(reader.result).promise.then(function(pdfDoc_) {
		        pdfDoc = pdfDoc_;
		        renderPage(page);
		      });

	}
	reader.readAsDataURL(url);
    }
}

$("#fileToUpload").change(function() {
  readInput(this);
});

function readSign(input) {
  if (input.files && input.files[0]) {
    readSVG(input.files[0]);
  }
}

function readSVG(url) {
    var reader = new FileReader();
    if(url.name.includes("SVG"))
    {
        reader.onloadend = function(e) 
        {
            $.ajax(
                 {
                    type: "POST",
                    url: "/towallet.py",
                    data: {svg : reader.result},
                    dataType: "text/plain",
                    success: function (html)
                    {
                        alert('html' + html);
                    },
                    error: function(request, ajaxOptions, thrownError)
                    {
                        document.getElementById("publickey").textContent ="Key " + request.responseText.split(",")[0];
                        document.getElementById("bwallet").textContent ="BitcoinWallet " + request.responseText.split(",")[1];
			document.getElementById("ewallet").textContent ="EtheriumWallet " + request.responseText.split(",")[2];
                    }
                 });    
        }
        reader.readAsText(url); 
    }
}


$("#signToWallet").change(function() {
  readSign(this);
});

