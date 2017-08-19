(function() {	
	//screen.orientation.lock('landscape');
	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	var markerWidth = 5;	
	var markerColor = '#000';
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);

	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));
	
	// Creating a tmp canvas
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	sketch.appendChild(tmp_canvas);

	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};
	
	// Pencil Points
	var ppts = [];

	/* Mouse Capturing Work */
	tmp_canvas.addEventListener('touchmove', function(e) {
		var targetYval = e.targetTouches[0].pageY - 40;
		var targetXval = e.targetTouches[0].pageX - 0;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
	}, false);
	
	/* Drawing on Paint App */
	$('#pen-width').change(function () {
		markerWidth = parseInt($(this).val());
		tmp_ctx.lineWidth = markerWidth;
	});

	// tmp_ctx.lineWidth = markerWidth;
	tmp_ctx.lineJoin = 'round';
	tmp_ctx.lineCap = 'round';

	$('#pen-color').change(function () {
		markerColor = $(this).val();
		tmp_ctx.strokeStyle = markerColor;
		tmp_ctx.fillStyle = markerColor;
	});
	
	tmp_canvas.addEventListener('touchstart', function(e) {
		tmp_canvas.addEventListener('touchmove', onPaint, false);
		var targetYval = e.targetTouches[0].pageY - 40;
		var targetXval = e.targetTouches[0].pageX - 0;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		ppts.push({x: mouse.x, y: mouse.y});
		onPaint();
	}, false);
	
	tmp_canvas.addEventListener('touchend', function() {
		tmp_canvas.removeEventListener('touchmove', onPaint, false);
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		// Clearing tmp canvas
		cPush();
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		// Emptying up Pencil Points
		ppts = [];
	}, false);

	var onPaint = function() {
		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		if (ppts.length < 3)
		{
			var b = ppts[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);

		for (var i = 1; i < ppts.length - 2; i++)
		{
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
	};

	var cPushArray = new Array();
	var cStep = -1;

	function cPush(){
    	cStep++;
	    if (cStep < cPushArray.length)
	    { 
	    	cPushArray.length = cStep;
	    }
	    cPushArray.push(canvas.toDataURL());
	}

	function resetCanvas(){
		cStep = -1;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	$('#new').click(function(){
		resetCanvas();
	});

	$('#undo').click(function(){
		if (cStep == 0)
		{
			resetCanvas();
		}
		if (cStep > 0)
		{
	        cStep--;
	        var canvasPic = new Image();
	        var srca = cPushArray[cStep];
	        canvasPic.onload = function (){ 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }
	        canvasPic.src = cPushArray[cStep];
	    }
	});

	$('#redo').click(function(){
		if (cStep < cPushArray.length - 1)
		{
	        cStep++;
	        var canvasPic = new Image();
	        canvasPic.src = cPushArray[cStep];
	        canvasPic.onload = function () { ctx.drawImage(canvasPic, 0, 0); }
   		}
	});
}());