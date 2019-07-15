var map = L.map('map').setView([40.436890, -3.647326], 5)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

L.easyButton( 'fa-redo', function(){
    
    markersMap.forEach(recargarPagina);

    function recargarPagina(value, key) {
      var grupoBorrar = markersMap.get(key);
      resultados.delete(key);
      markersMap.delete(key);
      if(grupoBorrar.getLayers().length > 0) {
        map.removeLayer(grupoBorrar);
      }
      ejecutarQuery(key);
    }

}).addTo(map);

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function descargarArchivo(contenidoEnBlob, nombreArchivo) {
  var reader = new FileReader();
  reader.onload = function (event) {
      //var save = document.getElementById('btn-descargar');
      var save = document.createElement('a');
      save.href = event.target.result;
      save.target = '_self';
      save.download = nombreArchivo || 'archivo.dat';
      document.body.appendChild(save);
		  save.click();
		  document.body.removeChild(save);
      (window.URL || window.webkitURL).revokeObjectURL(save.href);
  };
  reader.readAsDataURL(contenidoEnBlob);
};


/*document.getElementById('btn-descargar').addEventListener('click', function () {
  if (resultados.size > 1) {
    var csv = generarArchivo(resultados);
    this.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv);
  } 
  else {
    alert("No existen resultados para descargar");
  }
}, false);*/

function imprimirLista() {
  if (resultados.size > 1) {
    var txt = generarArchivo(resultados);
    var element = document.getElementById("resultados");
    element.innerHTML = '';
    for(var t = 0; t < txt.length; t++){
      element.innerHTML += '<li style="color:white">'+ txt[t] +'</li>'
    }
    $("#resultados").toggle();
  }
  else {
    alert("No existen resultados para descargar");
  }
}



function generarArchivo(resultados) {

  var texto = [];

  function logMapElements(value, key, map) {
    if(key != 0){
      for(var k = 0; k < value.length; k++){
        texto.push(value[k]);
        //texto.push('\n');
      }
    }
    else {
      texto.push(value);
      //texto.push('\n');
    }
  }

  resultados.forEach(logMapElements);
  return texto;
}

var markersMap = new Map();
var flagsMap = new Map();

var resultados = new Map();
resultados.set(0,'Resultados');

function ejecutarQuery(id) {

    checkbox = document.getElementById(id);

    var limites= map.getBounds();

    var coordxLimitSup = limites._northEast.lat;
    var coordyLimitSup = limites._northEast.lng;
    var coordxLimitInf = limites._southWest.lat;
    var coordyLimitInf = limites._southWest.lng;
  
    let uri = 'PREFIX dc: <http://purl.org/dc/terms/> PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> PREFIX btn100:<https://datos.ign.es/def/btn100#> select distinct ?recurso ?coordenadas ?nombre where { ?recurso a btn100:' + id + ' . ?recurso dc:title ?nombre . ?recurso geosparql:hasGeometry ?geoNucleo . ?geoNucleo geosparql:asWKT ?coordenadas. FILTER (bif:st_within(?coordenadas,"POLYGON((' + coordyLimitSup + ' ' + coordxLimitInf + ',' + coordyLimitInf + ' ' + coordxLimitInf + ',' + coordyLimitInf + ' ' + coordxLimitSup + ',' + coordyLimitSup + ' ' + coordxLimitSup + '))"^^<http://www.openlinksw.com/schemas/virtrdf#Geometry>))}'
    let geo_uri_encoded = "";
    geo_uri_encoded = encodeURIComponent(uri).replace(/'/g,"%27").replace(/"/g,"%22");	
    var geo_uri = "https://datos.ign.es/sparql?default-graph-uri=&query=" + geo_uri_encoded + "&format=json&timeout=0"
    
    $.ajax({
      method: 'GET',
      dataType: 'jsonp',
      url: geo_uri,
      success: function (respuesta) {

            datos = respuesta.results.bindings;

            var colorR = Math.floor((Math.random() * 256));
            var colorG = Math.floor((Math.random() * 256));
            var colorB = Math.floor((Math.random() * 256));

            var colorHex = "#" + componentToHex(colorR) + componentToHex(colorG) + componentToHex(colorB);

            if (checkbox.checked) {
              document.getElementById(id).style.boxShadow = "0 0 0 3px " + colorHex;
            }
            else {
              document.getElementById(id).style.boxShadow = 'none';
            }

            var markerObject = new Array();
            var poligonObject = new Array();
            var lineObject = new Array();
            var recursosMarcados = new Array();

            var groupMarkers = L.layerGroup([]);
            var groupPolygons = L.layerGroup([]);
            var groupLines = L.layerGroup([]);
        
            var x = 0;
            for(var i = 0; i < datos.length; i++) {

              let treeMarker =  L.ExtraMarkers.icon({
                icon: 'fa-circle',
                markerColor: 'white',
                iconColor: colorHex,
                shape: 'circle',
                prefix: 'fa'
              })
          
              var tipoDatos = datos[i].coordenadas.value.split("(")[0];
              var base = datos[i].coordenadas.value.split("(");
              
              var nombre = datos[i].nombre.value;
              var recurso = datos[i].recurso.value;

              if (tipoDatos == "POLYGON" && checkbox.checked) {

                var longPoligon = base[2].split(",").length;
                var puntoPol = base[2].split(",");
                var coordPol = new Array();
                for(var j = 0; j < longPoligon-1; j++) {
                  var coordyPol = puntoPol[j].split(" ")[0];
                  var coordxPol = puntoPol[j].split(" ")[1];
                  if (j == longPoligon-1) {
                    coordxPol = coordxPol.split(")")[0];
                  }
                  var arrayPol = [coordxPol,coordyPol];
                  coordPol.push(arrayPol);
                }
                poligonObject[i] = coordPol;
                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+" target='blank'>" + recurso +"</a>");
                var polygon = L.polygon(coordPol, {color: colorHex}).bindPopup(popup);
                x = x + 1;
                groupPolygons.addLayer(polygon)
                recursosMarcados.push(recurso);

              }
              else if (tipoDatos == "LINESTRING" && checkbox.checked) {

                var longLine = base[1].split(",").length;
                var puntoLine = base[1].split(",");
                var coordLine = new Array();
                for(var j = 0; j < longLine-1; j++) {
                  var coordyLine = puntoLine[j].split(" ")[0];
                  var coordxLine = puntoLine[j].split(" ")[1];
                  if (j == longLine-1) {
                    coordxLine = coordxLine.split(")")[0];
                  }
                  var arrayLine = [coordxLine,coordyLine];
                  coordLine.push(arrayLine);
                }
                lineObject[i] = coordLine;
                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+" target='blank'>" + recurso +"</a>");
                var line = L.polyline(coordLine, {color: colorHex}).bindPopup(popup);
                x = x + 1;
                groupLines.addLayer(line);
                recursosMarcados.push(recurso);

              }
              else if (tipoDatos == "POINT" && checkbox.checked) {

                var basePoint = base[1].split(" ");
                var long2 = basePoint[1].length;
                var coordy = basePoint[0];
                var coordx = basePoint[1].substring(0,long2-1);

                var popup = L.popup().setContent("<b>Tipo</b>: "+ id + "<br>" + "<b>Nombre</b>: "+ nombre + "<br><b>Recurso</b>:<br><a href="+recurso+" target='blank'>" + recurso +"</a>");
                var marker = L.marker([coordx, coordy]).bindPopup(popup).setIcon(treeMarker);
                markerObject[i] = marker;
                x = x + 1;
                groupMarkers.addLayer(marker);
                recursosMarcados.push(recurso);
              }
            }

            if(datos.length == 0) {
              var vacio = L.layerGroup([]);
              markersMap.set(id, vacio);
            }
            else {

              if (tipoDatos == "POINT") {
                if(x > 150 && checkbox.checked) {
                  alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                  var resultados150 = L.layerGroup([]);
                  var arrayLayers = groupMarkers.getLayers();
                  for(var s = 0; s < 150; s++) {
                    resultados150.addLayer(arrayLayers[s]);
                  }
                  map.addLayer(resultados150);
                  markersMap.set(id, resultados150);
                  resultados.set(id, recursosMarcados);
                }
                else if(x <= 150 && checkbox.checked) {
                  map.addLayer(groupMarkers);
                  markersMap.set(id, groupMarkers);
                  resultados.set(id, recursosMarcados);
                } 
                else {
                  var grupoBorrar = markersMap.get(id);
                  resultados.delete(id);
                  map.removeLayer(grupoBorrar);
                  markersMap.delete(id);
                }
              }
  
              if (tipoDatos == "POLYGON") {
                if(x > 150 && checkbox.checked) {
                  alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                  var resultados150 = L.layerGroup([]);
                  var arrayLayers = groupPolygons.getLayers();
                  for(var s = 0; s < 150; s++) {
                    resultados150.addLayer(arrayLayers[s]);
                  }
                  map.addLayer(resultados150);
                  markersMap.set(id, resultados150);
                  resultados.set(id, recursosMarcados);
                }
                else if(x <= 150 && checkbox.checked) {
                  map.addLayer(groupPolygons);
                  markersMap.set(id, groupPolygons);
                  resultados.set(id, recursosMarcados);
                } 
                else {
                  var grupoBorrar = markersMap.get(id);
                  resultados.delete(id);
                  map.removeLayer(grupoBorrar);
                  markersMap.delete(id);
                }
              }
  
              if (tipoDatos == "LINESTRING") {
                if(x > 150 && checkbox.checked) {
                  alert("Alcanzado número máximo de resultados (150). Para ver más recursos, haga zoom en el mapa y recargue la página.")
                  var resultados150 = L.layerGroup([]);
                  var arrayLayers = groupLines.getLayers();
                  for(var s = 0; s < 150; s++) {
                    resultados150.addLayer(arrayLayers[s]);
                  }
                  map.addLayer(resultados150);
                  markersMap.set(id, resultados150);
                  resultados.set(id, recursosMarcados);
                }
                else if(x <= 150 && checkbox.checked) {
                  map.addLayer(groupLines);
                  markersMap.set(id, groupLines);
                  resultados.set(id, recursosMarcados);
                } 
                else {
                  var grupoBorrar = markersMap.get(id);
                  resultados.delete(id);
                  map.removeLayer(grupoBorrar);
                  markersMap.delete(id);
                }
              }
            } 
      },
      error: function() { alert('Algo no va bien') },
    }); 
}