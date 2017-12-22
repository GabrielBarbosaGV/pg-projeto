// CONFIGURAÇÕES PRÉ-EXECUÇÃO

// FIM DE CONFIGURAÇÕES PRÉ-EXECUÇÃO

// FUNÇÕES PRÉ-EXECUÇÃO
function initializeZBuffer() {
	var screen = [];
	var row = [];

	for (let i = 0;i < canvas.height;i++) row.push({distance: Infinity, color: 'rgb(128, 128, 128)'}); //Coluna

	for (let i = 0;i < canvas.width;i++) screen.push(row);

	return screen;
}
// FIM DE FUNÇÕES PRÉ-EXECUÇÃO


// FUNÇÕES PARA LEITURA DE ARQUIVOS

//Verifica se as extensões .byu, .cfg e .txt foram escolhidas simultaneamente,
// sendo o caso, assume que todos os arquivos necessários foram escolhidos.
function hasNecessaryFiles() {
	let hasObj = false, hasCam = false, hasIll = false,
	inputs = document.getElementById('file-selection').getElementsByTagName('input');

	for (let inputN = 0;inputN < inputs.length;inputN++) {
		let extension = inputs[inputN].files[0].name.split('.');
		extension = extension[extension.length - 1];
		
		switch (extension) {
			case 'byu':
				if (objectInfo != undefined) hasObj = true;
				break;
			case 'cfg':
				if (cameraInfo != undefined) hasCam = true;
				break;
			case 'txt':
				if (illuminationInfo != undefined) hasIll = true;
				break;
			default:
				return false;
		}
	}

	return hasObj && hasCam && hasIll;
}

//Chamado quando um arquivo é selecionado através dos botões no canto inferior esquerdo da página principal,
// salva o conteúdo do arquivo em uma variável global apropriada.
function readFile(evt) {
	var files = evt.target.files;
	var reader = new FileReader();

	reader.onload = () => {
		let extension = files[0].name.split('.');
		extension = extension[extension.length - 1];

		switch (extension) {
			case 'byu':
				objectInfo = reader.result;
				break;
			case 'cfg':
				cameraInfo = reader.result;
				break;
			case 'txt':
				illuminationInfo = reader.result;
				break;
			default:
				alert("Unrecognised file exension, please select a recognised filetype. (.byu, .cfg, .txt)");
				break;
		}
	};

	reader.readAsText(files[0]);
}

//Converte a string guardada na variável global objectInfo em um objeto.
function interpretObjectInfo() {
	var objectLines = objectInfo.split('\r\n').filter(i => i);

	var info = objectLines[0].split(' ');

	for (let i in info) info[i] = parseFloat(info[i]);


	var points = [];

	for (let line = 0;line < info[0];line++) {
		var point = objectLines[line + 1].split(' ').filter(i => i), normal = [];

		for (let coord in point) {
		       	point[coord] = parseFloat(point[coord]);
			//Inicializa o vetor normal de um ponto para zero.
			normal.push(0);
		}

		//Cada ponto é um objeto contendo um array com suas coordenadas e um array representando seu vetor normal, inicialmente zero.
		points.push({point: point, normal: normal});
	}

	var triangles = [];

	for (let line = 1 + info[0];line < info[1] + 1 + info[0];line++) {
		var triangle = objectLines[line].split(' ').filter(i => i);

		for (let i in triangle) triangle[i] = parseInt(triangle[i]) - 1;

		//Cada triângulo é um objeto contendo um array com a numeração de seus pontos constituíntes e um array representando seu vetor normal.
		triangles.push({triangle: triangle, normal: 0});
	}

	return {
		points: points,
		triangles: triangles
	}
}

function interpretCameraInfo() {
	var cameraLines = cameraInfo.split('\r\n').filter(i => i);

	var c = cameraLines[0].split(' ').filter(i => i);

	for (let coord in c) c[coord] = parseFloat(c[coord]);


	var n = cameraLines[1].split(' ').filter(i => i);

	for (let coord in n) n[coord] = parseFloat(n[coord]);


	var v = cameraLines[2].split(' ').filter(i => i);

	for (let coord in v) v[coord] = parseFloat(v[coord]);


	var dhxhy = cameraLines[3].split(' ').filter(i => i);

	for (let val in dhxhy) dhxhy[val] = parseFloat(dhxhy[val]);

	return {
		c: c,
		n: n,
		v: v,
		u: 0,
		d: dhxhy[0],
		hx: dhxhy[1],
		hy: dhxhy[2]
	}
}

function interpretIlluminationInfo() {
	var illuminationLines = illuminationInfo.split('\r\n').filter(i => i);

	var pl = illuminationLines[0].split(' ').filter(i => i);

	for (let i in pl) pl[i] = parseFloat(pl[i]);

	var ka = parseFloat(illuminationLines[1]);


	var ia = illuminationLines[2].split(' ').filter(i => i);

	for (let i in ia) ia[i] = parseFloat(ia[i]);


	var kd = parseFloat(illuminationLines[3]);


	var od = illuminationLines[4].split(' ').filter(i => i);

	for (let i in od) od[i] = parseFloat(od[i]);


	var ks = parseFloat(illuminationLines[5]);


	var il = illuminationLines[6].split(' ').filter(i => i);

	for (let i in il) il[i] = parseInt(il[i]);


	var n = parseFloat(illuminationLines[7]);

	return {
		pl: pl,
		ka: ka,
		ia: ia,
		kd: kd,
		od: od,
		ks: ks,
		il: il,
		n: n
	}
}

function getNormals() {
	for (let i in object.triangles) {
		//Calcula arestas do triângulo a partir de seus pontos.
		let edgeA = pointSubtraction(object.points[object.triangles[i].triangle[0]].point,
				object.points[object.triangles[i].triangle[1]].point),
			edgeB = pointSubtraction(object.points[object.triangles[i].triangle[1]].point,
					object.points[object.triangles[i].triangle[2]].point);


		//Realiza produto vetorial entre os vetores aresta e normaliza o resultado.
		var normal = normalizeVector(vectorProduct(edgeA, edgeB));

		object.triangles[i].normal = normal;


		//Soma a normal deste triângulo a cada ponto pertencente a ele.
		for (let j in object.triangles[i].triangle) object.points[object.triangles[i].triangle[j]].normal =
			vectorSum(object.points[object.triangles[i].triangle[j]].normal, normal);
	}

	for (let pointN in object.points) object.points[pointN].normal = normalizeVector(object.points[pointN].normal);
}

//Retorna lista de pontos 2D resultantes da projeção a partir de pontos 3D
function getScreenCoordinates() {
	var newPoints = [], d = camera.d, hx = camera.hx, hy = camera.hy;
	for (let i in object.points) {
		let point = object.points[i].point; 
		var newPoint;

		newPoint = [((d/hx)*(point[0]/point[2])), ((d/hy)*(point[1]/point[2]))];

		newPoint[0] = Math.round((newPoint[0] + 1)*canvas.width / 2);
		newPoint[1] = Math.round((1 - newPoint[1])*canvas.height / 2);

		newPoints.push(newPoint);
	}

	return newPoints;
}

//Atribui dados extraídos de strings a objetos guardados em variáveis globais.
function interpretData(evt) {
	if (hasNecessaryFiles()) {
		camera = interpretCameraInfo();
		object = interpretObjectInfo();
		illumination = interpretIlluminationInfo();
		var matrixBasisChange;


		//Ortogonaliza em relação a N e então normaliza o vetor V
		camera.v = normalizeVector(gramSchmidt(camera.v, camera.n));

		//Calcula o terceiro vetor, U (de acordo com o arquivo Entrega 1, não precisa ser normalizado)
		camera.u = vectorProduct(camera.n, camera.v);

		//Calcula matriz de mudança de base
		matrixBasisChange = matrixChangeOfBasis(camera.u, camera.v, camera.n);

		//Multiplica matriz de mudança de base por coordenadas dos vértices subtraídos de C para convertê-los a coordenadas de vista (de acordo com o
		// descrito no arquivo de pipline do projeto)
		for (let pointN in object.points) {
			let cv = pointSubtraction(object.points[pointN].point, camera.c);
			let column = matrixMultiplication(matrixBasisChange, [[cv[0]], [cv[1]], [cv[2]]]);
			for (var i = 0; i < column.length; i++) {
				object.points[pointN].point[i] = column[i][0];
			}
		    
		}

		//Subtrai C da posição da iluminação para convertê-la a coordenadas de vista
		illumination.pl = matrixMultiplication(matrixBasisChange, pointSubtraction(illumination.pl, camera.c));

		getNormals();

		points2D = getScreenCoordinates();
		zBuffer = initializeZBuffer();
		drawObjectTriangles();
	} else alert('Please input valid files.');
}
// FIM DE FUNÇÕES PARA LEITURA DE ARQUIVOS

// FUNÇÕES PARA PONTOS

//Subtrai ponto ou vetor de um ponto
function pointSubtraction(pointA, toSubtract) {
	return vectorSubtraction(pointA, toSubtract);
}
// FIM DE FUNÇÕES PARA PONTOS


// FUNÇÕES PARA VETORES
function vectorSum(vectorA, vectorB) {
	if (vectorA.length === vectorB.length) {
		var sumVector = []
		for (let coordN in vectorA) sumVector.push(vectorA[coordN] + vectorB[coordN]);

		return sumVector;
	} else return NaN;
}

function vectorSubtraction(vectorA, toSubtract) {
	if (vectorA.length === toSubtract.length) {
		var subtractionVector = [];
		for (let coordN in vectorA) subtractionVector.push(vectorA[coordN] - toSubtract[coordN]);
		
		return subtractionVector;
	} else return NaN;
}

function innerProduct(vectorA, vectorB) {
	if (vectorA.length === vectorB.length) {
		var innerProduct = 0;
		for (let coordN in vectorA) innerProduct += vectorA[coordN]*vectorB[coordN];

		return innerProduct;
	} else return NaN;
}

function normalizeVector(vector) {
	var normalVector = vector, norm = vectorNorm(vector);

	for (let coordN in normalVector) normalVector[coordN] = normalVector[coordN]/norm;

	return normalVector;
}

function vectorNorm(vector) {
	var norm = 0;

	for (let coordN in vector) {
		norm += Math.pow(vector[coordN], 2);
	}

	return Math.sqrt(norm);
}

function projectVector(toProject, referenceVector) {
	let proportion = innerProduct(toProject, referenceVector)*innerProduct(referenceVector, referenceVector),
		projectedVector = [];

	for (let coordN in referenceVector) projectedVector.push(referenceVector[coordN]*proportion);

	return projectedVector;
}

function gramSchmidt(toChange, referenceVector) {
	return vectorSubtraction(toChange, projectVector(toChange, referenceVector));
}

function vectorProduct(vectorA, vectorB) {
	if ((vectorA.length === 3) && (vectorB.length === 3)) {
		var vectorProduct = [];

		vectorProduct.push(vectorA[1]*vectorB[2] - vectorA[2]*vectorB[1]);
		vectorProduct.push(vectorA[2]*vectorB[0] - vectorA[0]*vectorB[2]);
		vectorProduct.push(vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0]);

		return vectorProduct;
	} else return NaN;
}
// FIM DE FUNÇÕES PARA VETORES

// FUNÇÕES PARA MATRIZES
function makeMatrix(lineNumber, columnNumber) {
	var lines = [], column = [];

	for (let i = 0;i < columnNumber;i++) column.push(0);

	for (let i = 0;i < lineNumber;i++) lines.push(column);

	return lines;
}

function makeIdentityMatrix(lineNumber) {
	var identity = makeMatrix(lineNumber, lineNumber);

	for (let i = 0;i < lineNumber;i++) identity[i][i] = 1;

	return identity;
}

function matrixMultiplication(matrixA, matrixB) {
	var aNumRows = matrixA.length, aNumCols = matrixA[0].length,
      bNumRows = matrixB.length, bNumCols = matrixB[0].length,
      m = new Array(aNumRows);  // inicializa o array de linhas
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols); // inicializa a linha atual
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;             // inicializa a célula atual
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += matrixA[r][i] * matrixB[i][c];
      }
    }
  }
  return m;
}

function matrixChangeOfBasis(u, v, n){
   	var initialMatrix = [ [ u[0], v[0], n[0] ],
   						  [ u[1], v[1], n[1] ],
   						  [ u[2], v[2], n[2] ]];

    //Criação da matriz identidade e cópia da original
    var i=0, ii=0, j=0, dim=initialMatrix.length, e=0, t=0;
    var matrixBasisChange = [], mCopy = [];
    for(i=0; i<dim; i+=1){
        // Cria linha
        matrixBasisChange[matrixBasisChange.length]=[];
        mCopy[mCopy.length]=[];
        for(j=0; j<dim; j+=1){
            
            // Por 1 se estiver na diagonal na original e na cópia
            if(i==j){ matrixBasisChange[i][j] = 1; }
            else{ matrixBasisChange[i][j] = 0; }
            
            mCopy[i][j] = initialMatrix[i][j];
        }
    }
    
    // Operações elementares linha a linha
    for(i=0; i<dim; i+=1){
        // Opera com o elemento 'e' da diagonal
        e = mCopy[i][i];
        
        // se tivermos 0 na diagonal, trocamos com uma linha mais abaixo
        if(e==0){
            //procura por cada linha abaixo da linha i
            for(ii=i+1; ii<dim; ii+=1){
                if(mCopy[ii][i] != 0){
                    for(j=0; j<dim; j++){
                        e = mCopy[i][j];       
                        mCopy[i][j] = mCopy[ii][j];
                        mCopy[ii][j] = e;    
                        e = matrixBasisChange[i][j];     
                        matrixBasisChange[i][j] = matrixBasisChange[ii][j];
                        matrixBasisChange[ii][j] = e;     
                    }
                    break;
                }
            }
            e = mCopy[i][i];

            if(e==0){return}
        }
        
        // Dividimos linha toda por e, assim teremos 1 na diagonal
        for(j=0; j<dim; j++){
            mCopy[i][j] = mCopy[i][j]/e; //apply to original matrix
            matrixBasisChange[i][j] = matrixBasisChange[i][j]/e; //apply to identity
        }
        
        // Subtrai essa linha de todas as outras para obter 0 fora da diagonal
        for(ii=0; ii<dim; ii++){
            if(ii==i){continue;}
            
            e = mCopy[ii][i];
           	
            for(j=0; j<dim; j++){
                mCopy[ii][j] -= e*mCopy[i][j]; 
                matrixBasisChange[ii][j] -= e*matrixBasisChange[i][j]; 
            }
        }
    }
    
    return matrixBasisChange;
}
// FIM DE FUNÇÕES PARA MATRIZES


// FUNÇÕES PARA DESENHO

// Onde o algoritmo de rasterização é aplicado
function sortPointsByY(array) {
	array.sort(function(a,b) {
		var sort = object.points[a].point[1]-object.points[b].point[1];
		if (sort == 0) {
			return object.points[a].point[0]-object.points[b].point[0];
		} else {
			return sort;
		}
	});
}

function fillBottomFlatTriangle(v1, v2, v3, triangle) {
  var invslope1 = (v2[0] - v1[0]) / (v2[1] - v1[1]); 
  var invslope2 = (v3[0] - v1[0]) / (v3[1] - v1[1]);

  var curx1 = v1[0];
  var curx2 = v1[0];

  for (var scanlineY = v1[1]; scanlineY <= v2[1]; scanlineY++) {
    drawLine(curx1, scanlineY, curx2, scanlineY, triangle);
    curx1 += invslope1;
    curx2 += invslope2;
  }
}

	
function fillTopFlatTriangle(v1, v2, v3, triangle) {
  var invslope1 = (v3[0] - v1[0]) / (v3[1] - v1[1]);
  var invslope2 = (v3[0] - v2[0]) / (v3[1] - v2[1]);

  var curx1 = v3[0];
  var curx2 = v3[0];

  for (var scanlineY = v3[1]; scanlineY > v1[1]; scanlineY--)
  {
    drawLine(curx1, scanlineY, curx2, scanlineY, triangle);
    curx1 -= invslope1;
    curx2 -= invslope2;
  }
}

function drawTriangle(triangle) {
	var v1 = points2D[triangle.triangle[0]]; //Ponto 1 do triângulo passado como parâmetro
	var v2 = points2D[triangle.triangle[1]]; //Ponto 2 do triângulo passado como parâmetro
	var v3 = points2D[triangle.triangle[2]]; //Ponto 3 do triângulo passado como parâmetro

	if (v2[1] == v3[1]) { //Compara y dos pontos v2 e v3
		fillBottomFlatTriangle(v1, v2, v3, triangle);
	} else if (v1[1] == v2[1]) { //Compara y dos pontos v1 e v2
		fillTopFlatTriangle(v1, v2, v3, triangle);
	} else {
		var deltaY2perY3 = (v2[1] - v1[1]) / (v3[1] - v1[1]);
		if (deltaY2perY3 != Infinity) {
			var x4 = v1[0] + deltaY2perY3 * (v3[0] - v1[0]);
			var v4 = [x4, v2[1], v2[2]];
			fillBottomFlatTriangle(v1, v2, v4, triangle);
	    	fillTopFlatTriangle(v2, v4, v3, triangle);
		} 		
	}
}

function drawObjectTriangles() {
	for (let i in object.triangles) {
		sortPointsByY(object.triangles[i].triangle);
		drawTriangle(object.triangles[i]);
	}
}

function drawLine(originX, originY, destinyX, destinyY, triangle) {
	for (var i = originX; i < destinyX; i++) {
		drawPixel(i, originY, triangle);
	}
}

function drawPixel(x, y, triangle) {
	var v1 = points2D[triangle.triangle[0]]; //Ponto 1 do triângulo passado como parâmetro
	var v2 = points2D[triangle.triangle[1]]; //Ponto 2 do triângulo passado como parâmetro
	var v3 = points2D[triangle.triangle[2]]; //Ponto 3 do triângulo passado como parâmetro
	var v1_3D = object.points[triangle.triangle[0]].point; //Ponto 1 do triângulo passado como parâmetro
	var v2_3D = object.points[triangle.triangle[1]].point; //Ponto 2 do triângulo passado como parâmetro
	var v3_3D = object.points[triangle.triangle[2]].point; //Ponto 3 do triângulo passado como parâmetro

	var baric_coordinates, p_3D;
	baric_coordinates = getBaricCoordinates(v1, v2, v3, [x,y]);
	p_3D = getPoint3D(v1_3D, v2_3D, v3_3D, baric_coordinates);

	//console.log(Math.round(x));
	if (p_3D[2] < zBuffer[Math.floor(x)][Math.floor(y)].distance) {
		zBuffer[Math.floor(x)][Math.floor(y)].distance = p_3D[2];
		context.fillStyle = "#000000";
   		context.fillRect(x, y, 1, 1);
	} else {
		console.log("z rejeitado " + p_3D[2] + ' ' + zBuffer[Math.floor(x)][Math.floor(y)].distance);
	}
}

function getPoint3D(v1, v2, v3, baric) { //Retorna P' a partir da multiplicação das coordenadas baricêntricas pelos vértices 3D
	var x, y, z;
	x = baric.alfa * v1[0] + baric.beta * v2[0] + baric.gama * v3[0];
	y = baric.alfa * v1[1] + baric.beta * v2[1] + baric.gama * v3[1];
	z = baric.alfa * v1[2] + baric.beta * v2[2] + baric.gama * v3[2];
	return [x, y, z];
}

function getBaricCoordinates(v1, v2, v3, p) {	//Calcula coordenadas baricêntricas a partir dos vértices 2D
	var baricCoordinates;

	//MONTAGEM DA MATRIZ
	var sysMatrix = [ [ 1, 1, 1, 1 ],
   						  [ v1[0], v2[0], v3[0], p[0] ],
   						  [ v1[1], v2[1], v3[1], p[1] ]];

	//ESCALONAMENTO DA MATRIZ
    var i=0, ii=0, j=0, heightM = sysMatrix.length, widthM = sysMatrix[0].length, e=0, t=0;	

	// Operações elementares linha a linha
    for(i=0; i<heightM; i+=1){
        // Opera com o elemento 'e' da diagonal
        e = sysMatrix[i][i];
        
        // se tivermos 0 na diagonal, trocamos com uma linha mais abaixo
        if(e==0){
            //procura por cada linha abaixo da linha i
            for(ii=i+1; ii<heightM; ii+=1){
                if(sysMatrix[ii][i] != 0){
                    for(j=0; j<widthM; j++){
                        e = sysMatrix[i][j];       
                        sysMatrix[i][j] = sysMatrix[ii][j];
                        sysMatrix[ii][j] = e;       
                    }
                    break;
                }
            }
            e = sysMatrix[i][i];

            if(e==0){return}
        }
        
        // Dividimos linha toda por e, assim teremos 1 na diagonal
        for(j=0; j<widthM; j++){
            sysMatrix[i][j] = sysMatrix[i][j]/e; //apply to original matrix
        }
        
        // Subtrai essa linha de todas as outras para obter 0 fora da diagonal
        for(ii=0; ii<heightM; ii++){
            if(ii==i){continue;}
            
            e = sysMatrix[ii][i];
           	
            for(j=0; j<widthM; j++){
                sysMatrix[ii][j] -= e*sysMatrix[i][j]; 
            }
        }
    }

    baricCoordinates = {alfa: sysMatrix[0][3], beta: sysMatrix[1][3], gama: sysMatrix[2][3]};
    return baricCoordinates;
}

// FIM DE FUNÇÕES PARA DESENHO


//EXECUÇÃO:
var  object, camera, illumination,
	objectInfo, cameraInfo, illuminationInfo,
	points2D, canvas, context, zBuffer;

//window.onload para aguardar que os elementos sejam apropriadamente carregados.
window.onload = () => {
	//Seleciona as tags input dentro do div com id 'file-selection'
	let inputs = document.getElementById('file-selection').getElementsByTagName('input');

	for (let inputN = 0;inputN < inputs.length;inputN++) {
		//Liga aos inputs dentro da div com id 'file-selection' a função readFile, através do evento de escolha de um arquivo.
		document.getElementById(inputs[inputN].id).addEventListener('change', readFile, false);
	}


	//Liga ao botão 'Read files' a função interpretData, que deve rodar quando o botão for clicado
	document.getElementById('read').addEventListener('click', interpretData, false);

	canvas = document.getElementById('drawing');

	canvas.height = parseFloat(window.getComputedStyle(canvas).height);
	canvas.width = parseFloat(window.getComputedStyle(canvas).width);
	context = canvas.getContext('2d');
}
