$(function() {
    
        cont = false;
    
        $(".btn-filtro").click(function() {
            $(".subMenu").css('display','none');
            $(".subMenu2").css('display','none');
            $("#resultados").css('display','none');
            if(cont){
                $("#nav-menu").css('left','-100%');
                $("#map").css('z-index','0');
                cont = false;
            } else {
                $("#nav-menu").animate({
                    left: '0'
                });
                $("#map").css('z-index','-1');
                cont = true;
            }
        });
    
        $(".facets").click(function() {
            $("#subMenuFacets").toggle();
        });

        $("#btn-altimetria").click(function() {
            $("#subMenuAltimetria").toggle();
        });
    
        $("#btn-energia").click(function() {
            $("#subMenuEnregia").toggle();
        });

        $("#btn-hidrografia").click(function() {
            $("#subMenuHidrografia").toggle();
        });

        $("#btn-poblaciones").click(function() {
            $("#subMenuPoblaciones").toggle();
        });

        $("#btn-transporte").click(function() {
            $("#subMenuTransporte").toggle();
        });

        $("#btn-unidades").click(function() {
            $("#subMenuUnidades").toggle();
        });

        $("#btn-vertices").click(function() {
            $("#subMenuVertices").toggle();
        });

        $("#resultados").css('display','none');
    
    });