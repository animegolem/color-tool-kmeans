import define1 from "./f2202a02db0855ad@40.js";
import define2 from "./c53590e002aeaa0b@56.js";

function _1(md){return(
md`# Color abstract via multidim KMeans`
)}

function _imageSource(fileInput,FileAttachment){return(
fileInput({
  initialValue: FileAttachment("2008avg.jpg").blob(),
  accept: "image/*"
})
)}

function _3(html){return(
html`<canvas id="canvas"></canvas>`
)}

function _4(md){return(
md`## 2D polar proportional symbols`
)}

function _lesvg(d3,DOM,clusters,axisLabels,axisType,mce,imre,cs,rgb2hsv,yuv2rgb,HTMLColorFromRGB,ahsv2rgb,cielab2rgb,cieluv2rgb,zcc,contour)
{

  if (eval("typeof clusters") == 'undefined') { return; }

  var svg = d3.select(DOM.svg(600, 600))
  .attr('style', 'border: 1px solid grey');

  // Drawing the color circle
    var pi = Math.PI;
    var ro = pi / 2;
    const hist = svg.append("g");
    var bc = Math.sqrt(clusters[0].vectorIds.length);
    var nbnr = clusters.length;
    var sw = 600 / 160;
    var mw = ~~(600/2);
    var mh = ~~(600/2);
    var l = ~~(sw * 6);
    var so = 1; //Symbol opacity
    var coef = 1.4; // Radius mag. coef.
    // Outer circle
    hist.append("circle")
      .attr("cx", 300)
      .attr("cy", 300)
      .attr("r", 298)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "white");
    hist.append("line")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("x1", 2)
      .attr("y1", 298)
      .attr("x2", 598)
      .attr("y2", 298);
    hist.append("line")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("x1", 298)
      .attr("y1", 2)
      .attr("x2", 298)
      .attr("y2", 598);
    if (axisLabels == "Yes") {
      hist.append("text")
	      .text("<- Hue ->")
	      .attr("font-family", "sans-serif")
	      .attr("font-size", "10px")
	      .attr("fill", "grey")
        .attr("transform", "translate(508, 80) rotate(48)");
      switch (axisType) {
            case 'HLS':
                hist.append("text")
	                .text("<- Lum. ->")
	                .attr("font-family", "sans-serif")
	                .attr("font-size", "10px")
	                .attr("fill", "grey")
                  .attr("text-anchor", "middle")
                  .attr("transform", "translate(288,120) rotate(90)");
                break;
        case 'HSL':
                hist.append("text")
	                .text("<- Sat. ->")
	                .attr("font-family", "sans-serif")
	                .attr("font-size", "10px")
	                .attr("fill", "grey")
                  .attr("text-anchor", "middle")
                  .attr("transform", "translate(288,120) rotate(90)");
                break;
        }
    }
    var nbpc = mce; // Nb. of color to exclude (often background)
    for (var i = nbpc; i < nbnr; i++) {
        imre;
        if (clusters[i] == undefined) {continue;}
        var ce = clusters[i].centroid;      
        switch (cs) {
          case "RGB" :
            var sk = rgb2hsv(ce.r, ce.g, ce.b);
            var circleColor = "rgb(" + ce.r + "," + ce.g + "," + ce.b + ")";
            break;
          case "YUV" :
            var sl = yuv2rgb(ce.y, ce.u, ce.v);
            var sk = rgb2hsv(sl.r, sl.g, sl.b);
            var circleColor = HTMLColorFromRGB(sl);
            break;
          case "HSL" :
            var sk = ce;
            var circleColor = HTMLColorFromRGB(ahsv2rgb(ce));
            break;
          case "CIELAB" :
            var sl = cielab2rgb(ce.L_star, ce.a_star, ce.b_star);
            var sk = rgb2hsv(sl.r, sl.g, sl.b);
            var circleColor = HTMLColorFromRGB(sl);
            break;
          case "CIELUV" :
            debugger;
            var sl = cieluv2rgb(ce.L_star, ce.u_star, ce.v_star);
            var sk = rgb2hsv(sl.r, sl.g, sl.b);
            var circleColor = HTMLColorFromRGB(sl);
            break;
        }
        switch (axisType) {
            case 'HSL':
                var h = sk.h;
                var s = sk.s;
                var v = sk.v * coef;
                break;
            case 'HLS':
                var h = sk.h;
                var s = sk.v;
                var v = sk.s * coef;
                break;
        }
        var ht = ((pi * 2) * h / 255) - ro;
        var va = clusters[i].vectorIds.length * zcc;
        var ra = ~~(Math.sqrt(va) * sw / bc);
        var x = ~~(s * Math.cos(ht));
        var y = ~~(s * Math.sin(ht));
        var cci = (sk.v < 186) ? "rgb(255,255,255)" : "rgb(24,24,24)";
        var contourColor = 0;
        contour == "Yes" ? contourColor = cci :contourColor = circleColor;
        hist.append("circle")
          .attr("cx", mw + x)
          .attr("cy", mh + y)
          .attr("r", ra)
          .attr("fill",  circleColor)
          .attr("fill-opacity", so)
          .attr("stroke", contourColor)
          .attr("stroke-width", 1);
    }
  
  return svg.node();
}


function _cs(Inputs){return(
Inputs.radio(["RGB", "HSL","YUV","CIELAB","CIELUV"], {label: "Color space", value: "HSL"})
)}

function _nbcl(Inputs){return(
Inputs.range([2, 400], {value: 10, step: 10, label: "Nb. of clusters"})
)}

function _imre(Inputs){return(
Inputs.range([4, 500], {value: 104, step: 10, label: "Sampling step"})
)}

function _lumin(Inputs){return(
Inputs.range([0, 255], {value: 10, step: 1, label: "Min. luminosity"})
)}

function _axisType(Inputs){return(
Inputs.radio(["HLS", "HSL"], {label: "Axis", value: "HLS"})
)}

function _mce(Inputs){return(
Inputs.range([0, 10], {value: 1, step: 1, label: "Main colors excluded"})
)}

function _contour(Inputs){return(
Inputs.radio(["Yes", "No"], {label: "Symb. stroke", value: "Yes"})
)}

function _axisLabels(Inputs){return(
Inputs.radio(["Yes", "No"], {label: "Axis labels", value: "Yes"})
)}

function _zcc(Inputs){return(
Inputs.range([2, 200], {value: 100, step: 2, label: "Symbols size"})
)}

function _15(md){return(
md`*If you use the tool, please cite:*

Laurent Jégou (2019) Expanding the Sémiologie Graphique for contemporary cartography, some ideas from visual semiotics, art history and design, Cartography and Geographic Information Science, 46:2, 182-188, DOI: 10.1080/15230406.2018.1513343`
)}

async function _BMimgData(createImageBitmap,imageSource,DOM)
{
  // Image data reading to array
  const bitmap = await createImageBitmap(imageSource);
  const width = bitmap.width;
  const height = bitmap.height;
  const ctx = DOM.context2d(width, height, 1);
  ctx.canvas.value = true;
  ctx.drawImage(bitmap, 0, 0);

  // Image data displaying to canvas
  var canvas = document.getElementById("canvas");
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  var ctxOut = canvas.getContext("2d");
  ctxOut.drawImage(bitmap,0,0,width,height);

  var bd = Array();
  bd[0] = ctx.getImageData(0, 0, width, height).data;
  
  return bd;
}


function _vals(BMimgData,imre,cs,rgb2yuv,rgb2hsv,rgb2cielab,rgb2cieluv,lumin)
{
  var v = Array();
  const n = BMimgData[0].length;
  // Sampling the image data each imre step
  for (var i = 0; i < n; i+= ~~(4 * (imre * 4))) {
      var ps = i * 100 / n;
      var cy;
      var c = new Object();
      c.r = BMimgData[0][i];
      c.g = BMimgData[0][i+1];
      c.b = BMimgData[0][i+2];
      switch (cs) {
          case "RGB" :
            cy = {r: c.r, g: c.g, b: c.b};
            break;
          case "YUV" :
            cy = rgb2yuv(c.r, c.g, c.b);
            break;
          case "HSL" :
            cy = rgb2hsv(c.r, c.g, c.b);
            break;
          case "CIELAB" :
            cy = rgb2cielab(c.r, c.g, c.b);
            break;
          case "CIELUV" :
            cy = rgb2cieluv(c.r, c.g, c.b);
            break;
      }
      var nc = new Array(cy);
      var cm = (c.r + c.g + c.b) / 3;
      if (cm >= lumin) {
        v = v.concat(nc);
      }
  }
  
  return v;
}


function _18(md){return(
md`### JSON version of the palette`
)}

function _clustersExport(cs,clusters,HTMLColorFromRGB,yuv2rgb,ahsv2rgb,cielab2rgb,cieluv2rgb)
{
  var e = Array();
  switch (cs) {
    case "RGB" :
      for (var i=0; i< clusters.length; i++) {
        e.push({i: i, c: HTMLColorFromRGB(clusters[i].centroid),n: clusters[i].vectorIds.length, r: Math.floor(clusters[i].centroid.r), g: Math.floor(clusters[i].centroid.g), b: Math.floor(clusters[i].centroid.b)});
      }
      break;
   case "YUV" :
      for (var i=0; i< clusters.length; i++) {
        var c = yuv2rgb(clusters[i].centroid.y, clusters[i].centroid.u, clusters[i].centroid.v);
        e.push({i: i, c: HTMLColorFromRGB(c),n: clusters[i].vectorIds.length, r: c.r, g: c.g, b: c.b});
      }
      break;
   case "HSL" :
      for (var i=0; i< clusters.length; i++) {
        var c = ahsv2rgb(clusters[i].centroid);
        e.push({i: i, c: HTMLColorFromRGB(c),n: clusters[i].vectorIds.length, r: c.r, g: c.g, b: c.b});
      }
      break;
   case "CIELAB" :
      for (var i=0; i< clusters.length; i++) {
        var c = cielab2rgb(clusters[i].centroid.L_star, clusters[i].centroid.a_star, clusters[i].centroid.b_star);
        e.push({i: i, c: HTMLColorFromRGB(c),n: clusters[i].vectorIds.length, r: c.r, g: c.g, b: c.b});
      }
      break;
   case "CIELUV" :
      for (var i=0; i< clusters.length; i++) {
        var c = cieluv2rgb(clusters[i].centroid.L_star, clusters[i].centroid.u_star, clusters[i].centroid.v_star);
        e.push({i: i, c: HTMLColorFromRGB(c),n: clusters[i].vectorIds.length, r: c.r, g: c.g, b: c.b});
      }
      break;
   }
  return e;
}


function _20(md){return(
md`### Color palette ordered by decreasing numbers`
)}

function _21(Plot,clustersExport){return(
Plot.plot({
  x: {
    label: "Ranking",
    ticks: clustersExport.map((d) => d.i).filter((d, i) => i % 10 === 0),
    line: true,
    nice: true
  },
  y: {
    label: "nb.",
    type: "sqrt",
    grid: true
  },
  marks: [
    Plot.barY(clustersExport, {x: "i", y: "n", stroke: d => d.c == "rgb(255,255,255)" ? "grey" : d.c, fill: "c"})
  ],
  width: 1000
})
)}

function _22(md){return(
md`### Color palette ordered by hue`
)}

function _23(Plot,clustersExport,rgb2hsv){return(
Plot.plot({
  x: {
    label: "Ranking",
    ticks: clustersExport.map((d) => d.i).filter((d, i) => i % 10 === 0),
    line: true,
    nice: true
  },
  y: {
    label: "nb.",
    type: "sqrt",
    grid: true
  },
  marks: [
    Plot.barY(clustersExport, {x: d => (rgb2hsv(d.r, d.g, d.b)).h, y: "n", stroke: d => d.c == "rgb(255,255,255)" ? "grey" : d.c, fill: "c"})
  ],
  width: 1000
})
)}

function _24(md){return(
md`## Appendix`
)}

function _26(md){return(
md`This k-means javascript implementation is optimised for large and sparse data set by using an array of objects to represent a sparse matrix. — Stanley Fok https://github.com/stanleyfok/kmeans-engine

Via @Fil at https://observablehq.com/@fil/hello-kmeans-engine`
)}

function _clusters(clustering)
{
  var cl = clustering.clusters;
  cl.sort(function(a,b) {return b.vectorIds.length-a.vectorIds.length;});
  return cl;
}


async function _clustering(kmeans,vals,nbcl){return(
await new Promise((resolve, reject) =>
    kmeans.clusterize(vals, { k: nbcl }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    })
  )
)}

function _createImageBitmap(){return(
window.createImageBitmap ||
  ((blob) =>
    new Promise((resolve) => {
      let img = document.createElement("img");
      img.addEventListener("load", () => resolve(this));
      img.src = URL.createObjectURL(blob);
    }))
)}

function _rgb2hsv(){return(
function rgb2hsv(red, green, blue) {
	red /= 255.0;
	green /= 255.0;
	blue /= 255.0;
	var hue, sat, val,
	min   = Math.min(red, green, blue),
	max   = Math.max(red, green, blue),
	delta = max - min,
	val   = max;

	// This is gray (red==green==blue)
	if (delta === 0) {
		hue = sat = 0;
	} else {
		sat = delta / max;
		if (max === red) {
			hue = (green -  blue) / delta;
		} else if (max === green) {
			hue = (blue  -   red) / delta + 2;
		} else if (max ===  blue) {
			hue = (red   - green) / delta + 4;
		}
		hue /= 6;
		if (hue < 0) {
			hue += 1;
		}
	}

  var c = new Object();
  c.h = hue*255;
  c.s = sat*255;
  c.v = val*255;
	return c;
}
)}

function _ahsv2rgb(){return(
function (c) {
	var hue, sat, val;
	var red, grn, blu, i, f, p, q, t;
	hue = c.h;
	sat = c.s;
	val = c.v;
	hue%=255.0;
	if(sat==0) {return({r: Math.round(c.v), g: Math.round(c.v),b: Math.round(c.v)})};
	if(val==0) {return({r: 0, g: 0, b: 0});}
	sat/=255.0;
	val/=255.0;
	hue/=255.0;
	if (hue >= 1.0) {hue = 0.0} else {hue *= 6.0};
	i = Math.floor(hue);
	f = hue-i;
	p = val*(1-sat);
	q = val*(1-(sat*f));
	t = val*(1-(sat*(1-f)));
	if (i==0) {red=val; grn=t; blu=p;}
	else if (i==1) {red=q; grn=val; blu=p;}
	else if (i==2) {red=p; grn=val; blu=t;}
	else if (i==3) {red=p; grn=q; blu=val;}
	else if (i==4) {red=t; grn=p; blu=val;}
	else {red=val; grn=p; blu=q;}
	red = Math.floor(red*255.0);
	grn = Math.floor(grn*255.0);
	blu = Math.floor(blu*255.0);

	return {r: red, g: grn,b: blu};
}
)}

function _rgb2yuv(){return(
function rgb2yuv(r, g, b) {
  var y,u,v;
	y = Math.round(r *  .299000 + g *  .587000 + b *  .114000);
	u = Math.round(r * -.168736 + g * -.331264 + b *  .500000 + 128);
	v = Math.round(r *  .500000 + g * -.418688 + b * -.081312 + 128);
  
	var c = new Object();
  c.y = y; //Math.round(y*255);
  c.u = u; //Math.round(u*255);
  c.v = v; //Math.round(v*255);

	return c;
}
)}

function _yuv2rgb(){return(
function yuv2rgb(y, u, v) {
	var r = y + 1.4075 * (v - 128);
	var g = y - 0.3455 * (u - 128) - (0.7169 * (v - 128));
	var b = y + 1.7790 * (u - 128);

	var c = new Object();

	c.r=Math.floor(r);
	c.g=Math.floor(g);
	c.b=Math.floor(b);

	if (c.r<0) c.r=0;
	  else
	if (c.r>255) c.r=255;

	if (c.g<0) c.g=0;
	  else
	if (c.g>255) c.g=255;

	if (c.b<0) c.b=0;
	  else
	if (c.b>255) c.b=255;

	return c;
}
)}

function _rgb2cielab(rgb2xyz,xyz2cielab){return(
function rgb2cielab(r, g, b) {
	var xyz = rgb2xyz(r, g, b);
	var c = xyz2cielab(xyz);
	return c;
}
)}

function _rgb2xyz(){return(
function rgb2xyz(r, g, b) {
	var x, y, z;

	r = r / 255.0;
	g = g / 255.0;
	b = b / 255.0;
	
	if (r > 0.04045) {r = Math.pow((r + 0.055) / 1.055, 2.4)} else {r = r / 12.92};
	if (g > 0.04045) {g = Math.pow((g + 0.055) / 1.055, 2.4)} else {g = g / 12.92};
	if (b > 0.04045) {b = Math.pow((b + 0.055) / 1.055, 2.4)} else {b = b / 12.92};

	r = r * 100.0;
	g = g * 100.0;
	b = b * 100.0;

	x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
	y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
	z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

	var a = new Object();
  a.x = x;
  a.y = y;
  a.z = z;
	return a;
}
)}

function _xyz2cielab(wp,f){return(
function xyz2cielab(c) {
	var L_star, X, Y, Z, a_star, b_star, fY;
  var wpa = new wp();
  
  X = c.x, Y = c.y, Z = c.z;
  fY = f(Y / wpa.Yw);
  L_star = 116 * fY - 16;
  a_star = 500 * (f(X / wpa.Xw) - fY);
  b_star = 200 * (fY - f(Z / wpa.Zw));

	var a = new Object();
  a.L_star = L_star;
  a.a_star = a_star;
  a.b_star = b_star;
  return a;
}
)}

function _cielab2rgb(cielab2xyz,xyz2rgb){return(
function cielab2rgb(l, a, b) {
	var xyz = cielab2xyz(l, a, b);
	var c = xyz2rgb(xyz);
	return c;
}
)}

function _cielab2xyz(wp,g){return(
function cielab2xyz(l, a, b) {
  var L_star, X, Y, Z, a_star, b_star, temp;
  L_star = l, a_star = a, b_star = b;
  temp = (L_star + 16) / 116;
  var wpa = new wp();
  
  X = wpa.Xw * g(temp + a_star / 500);
  Y = wpa.Yw * g(temp);
  Z = wpa.Zw * g(temp - b_star / 200);

	var a = new Object();
  a.x = X;
  a.y = Y;
  a.z = Z;
  return a;
}
)}

function _xyz2rgb(){return(
function xyz2rgb(c) {
  var x, y, z;
	var r,g,b;

	x = c.x / 100.0;
	y = c.y / 100.0;
	z = c.z / 100.0;

	r = x * 3.2404542 + y * -1.5371385 + z *  -0.4985314;
	g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
	b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

	if (r > 0.0031308) {r = 1.055 * (Math.pow(r, (1/ 2.4))) - 0.055;} else {r = 12.92 * r;}
	if (g > 0.0031308) {g = 1.055 * (Math.pow(g, (1/ 2.4))) - 0.055;} else {g = 12.92 * g;}
	if (b > 0.0031308) {b = 1.055 * (Math.pow(b, (1/ 2.4))) - 0.055;} else {b = 12.92 * b;}

	r = (r * 255.0);
	g = (g * 255.0);
	b = (b * 255.0);
	if (r > 255) {r = 255;}
	if (r < 0) {r = 0;}
	if (g > 255) {g = 255;}
	if (g < 0) {g = 0;}
	if (b > 255) {b = 255;}
	if (b < 0) {b = 0;}

	var a = new Object();
  a.r = Math.floor(r);
  a.g = Math.floor(g);
  a.b = Math.floor(b);
	return a;
}
)}

function _rgb2cieluv(rgb2xyz,xyz2cieluv){return(
function rgb2cieluv(r, g, b) {
	var xyz = rgb2xyz(r, g, b);
	var c = xyz2cieluv(xyz);
	return c;
}
)}

function _xyz2cieluv(wp){return(
function xyz2cieluv(c) {
  if (c.x == 0 && c.y == 0 && c.z == 0) {
    var a = new Object();
    a.L_star = 0;
    a.u_star = 0;
    a.v_star = 0;
    return a;
  }
	var L_star, X, Y, Z, u_star, v_star, up, vp, u0p, v0p, Yd;
  var wpa = new wp();
  X = c.x, Y = c.y, Z = c.z;

	Yd = Y / wpa.Yw;
	if (Yd >= 0.00885645167903563082) {
		Yd = Math.pow(Yd, 1.0 / 3.0);
	} else {
		Yd = (7.787 * Yd) + (16.0 / 116.0);
	}

	up = (4.0 * X) / (X + (15.0 * Y) + (3.0 * Z));
  vp = (9.0 * Y) / (X + (15.0 * Y) + (3.0 * Z));
  u0p = (4.0 * wpa.Xw) / (wpa.Xw + (15.0 * wpa.Yw) + (3.0 * wpa.Zw));
  v0p = (9.0 * wpa.Yw) / (wpa.Xw + (15.0 * wpa.Yw) + (3.0 * wpa.Zw));
  L_star = (116.0 * Yd) - 16.0;
  u_star = 13.0 * L_star * (up - u0p);
  v_star = 13.0 * L_star * (vp - v0p);
    
  var a = new Object();
  a.L_star = L_star;
  a.u_star = u_star;
  a.v_star = v_star;
  return a;
}
)}

function _cieluv2rgb(cieluv2xyz,xyz2rgb){return(
function cieluv2rgb(l, u, v) {
	var xyz = cieluv2xyz(l, u, v);
	var c = xyz2rgb(xyz);
	return c;
}
)}

function _cieluv2xyz(wp){return(
function cieluv2xyz(l, u, v) {
	var L_star, X, Y, Z, u_star, v_star, u_w, v_w, u_prime, v_prime;
  var wpa = new wp();
	L_star = l;
	u_star = u;
	v_star = v;
	
	Y = (L_star + 16.0) / 116.0;
  if (Math.pow(Y, 3.0) > 0.00885645167903563082) {
      Y = Math.pow(Y, 3.0);
  } else {
      Y = (Y - (16.0/116.0))/7.787;
  }

  u_w = (4.0 * wpa.Xw) / (wpa.Xw + (15.0 * wpa.Yw) + (3.0 * wpa.Zw));
  v_w = (9.0 * wpa.Yw) / (wpa.Xw + (15.0 * wpa.Yw) + (3.0 * wpa.Zw));
  u_prime = u_star / (13.0 * L_star) + u_w;
  v_prime = v_star / (13.0 * L_star) + v_w;

  Y = Y * 100.0;
  X = -(9.0 * Y * u_prime) / ((u_prime - 4.0) * v_prime - u_prime * v_prime);
  Z = (9.0 * Y - (15.0 * v_prime * Y) - (v_prime * X)) / (3.0 * v_prime);

  var a = new Object();
  a.x = X;
  a.y = Y;
  a.z = Z;
  return a;
}
)}

function _f(){return(
function(t) {
  var d = 6 / 29;
  if (t > d * d * d) {
    return Math.pow(t, 1 / 3);
  } else {
    return t / 3 / d / d + 4 / 29;
  }
}
)}

function _g(){return(
function(t) {
  var d = 6 / 29;
  if (t > d) {
    return t * t * t;
  } else {
    return 3 * d * d * (t - 4 / 29);
  }
}
)}

function _wp(){return(
function wp() {
  this.Xw =   95.047;
  this.Yw =  100.0;
  this.Zw =  108.883;
}
)}

function _HTMLColorFromRGB(){return(
function(ce){
  var circleColor = "";
  if (isNaN(ce.r) || isNaN(ce.g) || isNaN(ce.b)) {
    circleColor = "rgb(255,255,255)";
  } else {
    circleColor = "rgb(" + Math.floor(ce.r) + "," + Math.floor(ce.g) + "," + Math.floor(ce.b) + ")";
  }
    return circleColor;
}
)}

function _d3(require){return(
require("d3")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["2008avg.jpg", {url: new URL("./files/913ebe65a9e9c37a1e68cc65d4980686da9b34eac3c4b5b37e062f3f240fedf8d156feab0cbd5ca48c81e25b27d3f2e4343a6af053e3ab5edbfd0d2c5aa15fcd.jpeg", import.meta.url), mimeType: "image/jpeg", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof imageSource")).define("viewof imageSource", ["fileInput","FileAttachment"], _imageSource);
  main.variable(observer("imageSource")).define("imageSource", ["Generators", "viewof imageSource"], (G, _) => G.input(_));
  main.variable(observer()).define(["html"], _3);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("viewof lesvg")).define("viewof lesvg", ["d3","DOM","clusters","axisLabels","axisType","mce","imre","cs","rgb2hsv","yuv2rgb","HTMLColorFromRGB","ahsv2rgb","cielab2rgb","cieluv2rgb","zcc","contour"], _lesvg);
  main.variable(observer("lesvg")).define("lesvg", ["Generators", "viewof lesvg"], (G, _) => G.input(_));
  main.variable(observer("viewof cs")).define("viewof cs", ["Inputs"], _cs);
  main.variable(observer("cs")).define("cs", ["Generators", "viewof cs"], (G, _) => G.input(_));
  main.variable(observer("viewof nbcl")).define("viewof nbcl", ["Inputs"], _nbcl);
  main.variable(observer("nbcl")).define("nbcl", ["Generators", "viewof nbcl"], (G, _) => G.input(_));
  main.variable(observer("viewof imre")).define("viewof imre", ["Inputs"], _imre);
  main.variable(observer("imre")).define("imre", ["Generators", "viewof imre"], (G, _) => G.input(_));
  main.variable(observer("viewof lumin")).define("viewof lumin", ["Inputs"], _lumin);
  main.variable(observer("lumin")).define("lumin", ["Generators", "viewof lumin"], (G, _) => G.input(_));
  main.variable(observer("viewof axisType")).define("viewof axisType", ["Inputs"], _axisType);
  main.variable(observer("axisType")).define("axisType", ["Generators", "viewof axisType"], (G, _) => G.input(_));
  main.variable(observer("viewof mce")).define("viewof mce", ["Inputs"], _mce);
  main.variable(observer("mce")).define("mce", ["Generators", "viewof mce"], (G, _) => G.input(_));
  main.variable(observer("viewof contour")).define("viewof contour", ["Inputs"], _contour);
  main.variable(observer("contour")).define("contour", ["Generators", "viewof contour"], (G, _) => G.input(_));
  main.variable(observer("viewof axisLabels")).define("viewof axisLabels", ["Inputs"], _axisLabels);
  main.variable(observer("axisLabels")).define("axisLabels", ["Generators", "viewof axisLabels"], (G, _) => G.input(_));
  main.variable(observer("viewof zcc")).define("viewof zcc", ["Inputs"], _zcc);
  main.variable(observer("zcc")).define("zcc", ["Generators", "viewof zcc"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("BMimgData")).define("BMimgData", ["createImageBitmap","imageSource","DOM"], _BMimgData);
  main.variable(observer("vals")).define("vals", ["BMimgData","imre","cs","rgb2yuv","rgb2hsv","rgb2cielab","rgb2cieluv","lumin"], _vals);
  main.variable(observer()).define(["md"], _18);
  main.variable(observer("clustersExport")).define("clustersExport", ["cs","clusters","HTMLColorFromRGB","yuv2rgb","ahsv2rgb","cielab2rgb","cieluv2rgb"], _clustersExport);
  main.variable(observer()).define(["md"], _20);
  main.variable(observer()).define(["Plot","clustersExport"], _21);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer()).define(["Plot","clustersExport","rgb2hsv"], _23);
  main.variable(observer()).define(["md"], _24);
  const child1 = runtime.module(define1);
  main.import("kmeans", child1);
  main.variable(observer()).define(["md"], _26);
  main.variable(observer("clusters")).define("clusters", ["clustering"], _clusters);
  main.variable(observer("clustering")).define("clustering", ["kmeans","vals","nbcl"], _clustering);
  main.variable(observer("createImageBitmap")).define("createImageBitmap", _createImageBitmap);
  main.variable(observer("rgb2hsv")).define("rgb2hsv", _rgb2hsv);
  main.variable(observer("ahsv2rgb")).define("ahsv2rgb", _ahsv2rgb);
  main.variable(observer("rgb2yuv")).define("rgb2yuv", _rgb2yuv);
  main.variable(observer("yuv2rgb")).define("yuv2rgb", _yuv2rgb);
  main.variable(observer("rgb2cielab")).define("rgb2cielab", ["rgb2xyz","xyz2cielab"], _rgb2cielab);
  main.variable(observer("rgb2xyz")).define("rgb2xyz", _rgb2xyz);
  main.variable(observer("xyz2cielab")).define("xyz2cielab", ["wp","f"], _xyz2cielab);
  main.variable(observer("cielab2rgb")).define("cielab2rgb", ["cielab2xyz","xyz2rgb"], _cielab2rgb);
  main.variable(observer("cielab2xyz")).define("cielab2xyz", ["wp","g"], _cielab2xyz);
  main.variable(observer("xyz2rgb")).define("xyz2rgb", _xyz2rgb);
  main.variable(observer("rgb2cieluv")).define("rgb2cieluv", ["rgb2xyz","xyz2cieluv"], _rgb2cieluv);
  main.variable(observer("xyz2cieluv")).define("xyz2cieluv", ["wp"], _xyz2cieluv);
  main.variable(observer("cieluv2rgb")).define("cieluv2rgb", ["cieluv2xyz","xyz2rgb"], _cieluv2rgb);
  main.variable(observer("cieluv2xyz")).define("cieluv2xyz", ["wp"], _cieluv2xyz);
  main.variable(observer("f")).define("f", _f);
  main.variable(observer("g")).define("g", _g);
  main.variable(observer("wp")).define("wp", _wp);
  main.variable(observer("HTMLColorFromRGB")).define("HTMLColorFromRGB", _HTMLColorFromRGB);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  const child2 = runtime.module(define2);
  main.import("fileInput", child2);
  return main;
}
