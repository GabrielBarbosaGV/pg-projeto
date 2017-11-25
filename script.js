// FUNÇÕES PARA LEITURA DE ARQUIVOS

// FIM DE FUNÇÕES PARA LEITURA DE ARQUIVOS



// FUNÇÕES PARA VETORES 
function innerProduct(vectorA, vectorB) {
	if (vectorA.length === vectorB.length) {
		var innerProduct = 0;

		for (let coordN in vectorA) {
			innerProduct += vectorA[coordN]*vectorB[coordN];
		}
	} else return NaN;
}

function normalizeVector(vector) {
	var normalVector = 0;

	for (let coordN in vector) {
		normalVector += Math.pow(vector[coordN], 2);
	}

	return Math.sqrt(normalVector);
}

function gramSchmidt(toChange, referenceVector) {

}
// FIM DE FUNÇÕES PARA VETORES

var camera;

function readFile(evt) {
  var files = evt.target.files;
  var reader = new FileReader();
  reader.onload = function() {
    camera = reader.result;
  };
  reader.readAsText(files[0]);
}

document.getElementById('file1').addEventListener('change', readFile, false);