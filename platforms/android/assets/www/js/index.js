$(document).ready(function(){

	$("#colorpicker").spectrum({
    	color: "#121212"
	});

	var grid = 0;
	//set pencil as starting tool onload
	$('.tools-item').removeClass('active');
	$('#pencil').addClass('active');

	$("#collapse-tools").click(function(){
		$(".left-menu").toggleClass('tools-hidden');
		$(".top-menu").toggleClass('tools-hiddens');
		$(".tools-item").toggleClass('tools-hidden');
		$("#pen-width").toggleClass('tools-hidden');
		$("span").toggleClass('tools-hidden');
		$("#menu-right").toggleClass('tools-hidden');
		$(".tools-left").toggleClass('tools-hidden');
	});

	$('#pencil').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active');
	});

	$('#brush').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active');
	});

	$('#eraser').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active');
	});

	$('#blender').click(function(){
		$('.tools-item').removeClass('active');
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active');
	});

	$('#color-picker').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active-left');
	});

	$('#paint-bucket').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active-left');
	});

	$('#shapes').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
		$(this).addClass('active-left');
	});

	$('#move-tool').click(function(){
		$('.tools-item').removeClass('active');	
		$('.tools-left').removeClass('active-left');
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

	$('#new-canvas').click(function(){
		alert("clear canvas");
	});
});