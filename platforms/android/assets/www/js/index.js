$(document).ready(function(){
	$('.simple_color_live_preview').simpleColor({ livePreview: true, cellWidth: 15, cellHeight: 15 });
	
	$('#canvas-settings').click(function(){
		$('#canvas-settings-modal').css("display", "block");
	});

	$("#save-image").click(function(){
		$('#save-modal').css("display", "block");
	});

	$('.close').click(function(){
		$('#canvas-settings-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('.close-save').click(function(){
		$('#save-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('.close-connect').click(function(){
		$('#connect-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('#close-share').click(function(){
		$('#share-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
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

	$('#share').click(function(){
		$('#share-modal').css("display", "block");
	});

	$('#open-file').click(function(){
		/*window.filepicker.setKey('com.example.GizDraw');
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
	    console.log(window);*/
	});

	$('#preset-first').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-second').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-third').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-fourth').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});
});