$(document).ready(function(){

	$('.simple_color_live_preview').simpleColor({ livePreview: true, cellWidth: 15, cellHeight: 15 });

	var grid = 0;
	
	//set pencil as starting tool onload
	$('.tools-item').removeClass('active');
	$('#pencil').addClass('active');

	$('#custom-bg-color').css("display", "none");
	$('#connect-modal').css("display", "none");

	$("#collapse-tools").click(function(){
		$(".left-menu").toggleClass('tools-hidden');
		$(".top-menu").toggleClass('tools-hiddens');
		$(".tools-item").toggleClass('tools-hidden');
		$("#pen-width").toggleClass('tools-hidden');
		$(".simpleColorDisplay").toggleClass('tools-hidden');
		$("#menu-right").toggleClass('tools-hidden');
		$(".tools-left").toggleClass('tools-hidden');
	});

	$('#pencil').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active');
	});

	$('#brush').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "inline-block");
		$(this).addClass('active');
	});

	$('#eraser').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active');
	});

	$('#blender').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active');
	});

	$('#color-picker').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active-left');
	});

	$('#paint-bucket').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active-left');
	});

	$('#shapes').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active-left');
	});

	$('#move-tool').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$('.presets').css("display", "none");
		$(this).addClass('active-left');
	});

	$('#grid').click(function(){
		$(this).toggleClass('active-grid');
		$('.grid-svg').toggleClass('show-grid');
	});

	$('#settings').click(function(){
		$(this).toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});
	
	$('#canvas-settings').click(function(){
		$('#canvas-settings-modal').css("display", "block");
	});

	$('.close').click(function(){
		$('#canvas-settings-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('.close-connect').click(function(){
		$('#connect-modal').css("display", "none");
	});

	$('#canvas-type').change(function(){
		var canvasType = $(this).val();
		if (canvasType == "Color") {
			$('#custom-bg-color').fadeIn('slow');
		} else {
			$('#custom-bg-color').fadeOut('slow');
		}
	});

	$('#connect-pc').click(function(){
		$('#connect-modal').css("display", "block");
	});

	$('#setCanvasType').click(function(){
		var canvasType = $('#canvas-type').val();
		if (canvasType == "Color") {
			var colorSet = $('#custom-bg-color').val();
			$('#sketch').css("background-color", colorSet);
		} else if (canvasType == "White") {
			$('#sketch').css("background-color", "white");
		}
	});

	$('#open-file').click(function(){
		window.filepicker.setKey('com.example.GizDraw');
	    window.filepicker.setName('GizDraw');
	    window.filepicker.pickAndStore({
	        multiple: false,
	        mimeTypes: ['image/*',],
	        services : ['GALLERY'],
	        maxFiles: 2,
	        maxSize: (10*1024*1024)
	    }, {
	        location : 'S3',
	        path : '/location/'
	    }, function(res) {
	        alert("Success:"+res);
	    }, function(e) {
	       	alert("Error:"+e);
	    });
	    //console.log(window);
	});

	$('#save-file').click(function(){
		var canvas = document.querySelector('#paint');
		var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        window.location.href  = image; // it will save locally
        alert(1);
	});

});