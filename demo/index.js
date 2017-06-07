PDFJS.workerSrc = 'build/dist/build/pdf.worker.js';
var DEFAULT_URL = 'compressed.tracemonkey-pldi-09.pdf';
var SCALE = 1.0;
var container = document.getElementById('pageContainer');
function getContextByPage(page){
    container.innerHTML = "";
    page = parseInt(page);
    PDFJS.getDocument(DEFAULT_URL).then(function (pdfDocument) {
        document.getElementById('allpages').innerHTML = pdfDocument.numPages;
        pdfDocument.getPage(page).then(function (pdfPage) {
            var pdfPageView = new PDFJS.PDFPageView({
                container: container,
                id: page,
                scale: SCALE,
                defaultViewport: pdfPage.getViewport(SCALE),
                textLayerFactory: new PDFJS.DefaultTextLayerFactory(),
                annotationLayerFactory: new PDFJS.DefaultAnnotationLayerFactory()
            });
            pdfPageView.setPdfPage(pdfPage);
            pdfPageView.draw();
        });
    });
}
function jumpPage(){
    var page = document.getElementById('page').value;
    getContextByPage(page);
}

getContextByPage(1);