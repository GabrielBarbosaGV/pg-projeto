// CONFIGURAÇÕES PRÉ-EXECUÇÃO

// FIM DE CONFIGURAÇÕES PRÉ-EXECUÇÃO



// FUNÇÕES PARA LEITURA DE ARQUIVOS
function hasNecessaryFiles() {
	let hasObj = false, hasCam = false, hasIll = false,
	inputs = document.getElementById('file-selection').getElementsByTagName('input');

	for (let inputN = 0;inputN < inputs.length;inputN++) {
		let extension = inputs[inputN].files[0].name.split('.');
		extension = extension[extension.length - 1];
		
		switch (extension) {
			case 'byu':
				hasObj = true;
				break;
			case 'cfg':
				hasCam = true;
				break;
			case 'txt':
				hasIll = true;
				break;
			default:
				return false;
		}
	}

	return hasObj && hasCam && hasIll;
}

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

function interpretObjectInfo() {
	var objectLines = objectInfo.split(/\r\n/).filter(i => i);

	var info = objectLines[0].split(' ');

	for (let i in info) info[i] = parseFloat(info[i]);


	var points = [];

	for (let line = 1;line < info[0] + 1;line++) {
		var point = objectLines[line + 1].split(' ');

		for (let coord in point) point[coord] = parseFloat(point[coord]);

		points.push(point);
	}

	var triangles = [];

	for (let line = 1 + info[0];line < info[1] + 1 + info[0];line++) {
		var triangle = objectLines[line].split(' ');

		for (let i in triangle) triangle[i] = parseInt(triangle[i]) - 1;

		triangles.push(triangle);
	}

	return {
		points: points,
		triangles: triangles
	}
}

function interpretCameraInfo() {
	var cameraLines = cameraInfo.split(/\r\n/).filter(i => i);

	var c = cameraLines[0].split(' ');

	for (let coord in c) c[coord] = parseFloat(c[coord]);


	var n = cameraLines[1].split(' ');

	for (let coord in n) n[coord] = parseFloat(n[coord]);


	var v = cameraLines[2].split(' ');

	for (let coord in v) v[coord] = parseFloat(v[coord]);


	var dhxhy = cameraLines[3].split(' ');

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
	var illuminationLines = illuminationInfo.split(/\r\n/).filter(i => i);

	var pl = illuminationInfo[0].split(' ');

	for (let i in pl) pl[i] = parseFloat(pl[i]);

	var ka = parseFloat(illuminationInfo[1]);


	var ia = illuminationInfo[2].split(' ');

	for (let i in ia) ia[i] = parseFloat(ia[i]);


	var kd = parseFloat(illuminationInfo[3]);


	var od = illuminationInfo[4].split(' ');

	for (let i in od) od[i] = parseFloat(od[i]);


	var ks = parseFloat(illuminationInfo[5]);


	var il = illuminationInfo[6].split(' ');

	for (let i in il) il[i] = parseInt(il[i]);


	var n = parseFloat(illuminationInfo[7]);

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

function interpretData(evt) {
	if (hasNecessaryFiles()) {
		camera = interpretCameraInfo();
		object = interpretObjectInfo();
		illumination = interpretIlluminationInfo();

		camera.v = gramSchmidt(camera.v, camera.n);
		camera.u = vectorProduct(camera.n, camera.v);
	} else alert('Please input valid files.');
}
// FIM DE FUNÇÕES PARA LEITURA DE ARQUIVOS



// FUNÇÕES PARA VETORES
function innerProduct(vectorA, vectorB) {
	if (vectorA.length === vectorB.length) {
		var innerProduct = 0;

		for (let coordN in vectorA) {
			innerProduct += vectorA[coordN]*vectorB[coordN];
		}

		return innerProduct;
	} else return NaN;
}

function normalizeVector(vector) {
	var normalVector = vector, norm = vectorNorm(vector);

	for (let coordN in normalVector) normalVector[coordN] = normalVector[coordN]/norm;

	return normalVector;
}

function vectorNorm(vector) {
	var normalVector = 0;

	for (let coordN in vector) {
		versor += Math.pow(vector[coordN], 2);
	}

	return Math.sqrt(versor);
}

function projectVector(toProject, referenceVector) {
	let proportion = innerProduct(toProject, referenceVector)*innerProduct(referenceVector, referenceVector),
		projectedVector = [];

	for (let coordN in referenceVector) projectedVector.push(referenceVector[coordN]*proportion);

	return projectedVector;
}

function gramSchmidt(toChange, referenceVector) {
	return toChange - projectVector(toChange, referenceVector);
}

function vectorProduct(vectorA, vectorB) {
	if (vectorA.length === vectorB.length === 3) {
		var vectorProduct = [];

		vectorProduct.push(vectorA[1]*vectorB[2] - vectorA[2]*vectorB[1]);
		vectorProduct.push(vectorA[2]*vectorB[0] - vectorA[0]*vectorB[2]);
		vectorProduct.push(vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0]);

		return product;
	} else return NaN;
}
// FIM DE FUNÇÕES PARA VETORES


//EXECUÇÃO:
var  object, camera, illumination,
	objectInfo, cameraInfo, illuminationInfo;

window.onload = () => {
	let inputs = document.getElementById('file-selection').getElementsByTagName('input');

	for (let inputN = 0;inputN < inputs.length;inputN++) {
		document.getElementById(inputs[inputN].id).addEventListener('change', readFile, false);
	}


	document.getElementById('read').addEventListener('click', interpretData, false);
}
