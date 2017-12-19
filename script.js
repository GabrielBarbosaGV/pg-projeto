// CONFIGURAÇÕES PRÉ-EXECUÇÃO

// FIM DE CONFIGURAÇÕES PRÉ-EXECUÇÃO



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

	for (let line = 1;line < info[0] + 1;line++) {
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

//Atribui dados extraídos de strings a objetos guardados em variáveis globais.
function interpretData(evt) {
	if (hasNecessaryFiles()) {
		camera = interpretCameraInfo();
		object = interpretObjectInfo();
		illumination = interpretIlluminationInfo();


		//Ortogonaliza em relação a N e então normaliza o vetor V 
		camera.v = normalizeVector(gramSchmidt(camera.v, camera.n));

		//Calcula o terceiro vetor, U (de acordo com o arquivo Entrega 1, não precisa ser normalizado)
		camera.u = vectorProduct(camera.n, camera.v);

		//Subtrai C dos vértices para convertê-los a coordenadas de vista (de acordo com o descrito no arquivo de pipeline do projeto)
		for (let pointN in object.points) {
		       object.points[pointN].point = pointSubtraction(object.points[pointN].point, camera.c);
		}

		//Subtrai C da posição da iluminação para convertê-la a coordenadas de vista
		illumination.pl = pointSubtraction(illumination.pl, camera.c);

		getNormals();
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

	for (let i = 0;i < lineNumber,i++) lines.push(column);

	return { lines: lines; }
}

function makeIdentityMatrix(lineNumber) {
	var identity = makeMatrix(lineNumber, lineNumber);

	for (let i = 0;i < lineNumber;i++) identity.lines[i][i] = 1;

	return identity;
}

function matrixMultiplication(matrixA, matrixB) {
	//Número de colunas da primeira matriz deve ser igual ao número de linhas da segunda
	if (matrixA.lines[0].length === matrixB.lines.length) {
		var returnMatrix = makeMatrix(matrixA.lines.length, matrixB.lines[0].length);

		for (let i in returnMatrix.lines) {
			for (let j in returnMatrix.lines[0]) {
				currentValue = 0;

				for (let k in matrixA.lines[i]) {
					for (let l in matrixB.lines) {
						currentValue += matrixA.lines[i][k]*matrixB.lines[l][j];
					}
				}

				returnMatrix.lines[i][j] = currentValue;
			}
		}

		return returnMatrix;
	} else return NaN;
}
// FIM DE FUNÇÕES PARA MATRIZES


//EXECUÇÃO:
var  object, camera, illumination,
	objectInfo, cameraInfo, illuminationInfo,
	points2D;

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
}
