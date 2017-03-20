'use strict';
var a = require("array-tools");
var Parse = require('parse/node');
const config = require('config');
Parse.initialize(config.get('parse_id_app'), config.get('parse_js_key'));
Parse.serverURL = config.get('parse_url');

var Monitora = {
	
	/*
	Search a congressman by name
	*/
	getPoliticos: function(params, callback){
		var Politico = Parse.Object.extend("Politico");
		var query = new Parse.Query(Politico);
		query.equalTo("tipo", params.casa);
		query.limit(parseInt(params.limit));
		query.skip(parseInt(params.pg));
		query.ascending("nome");
		if(params.fullName){
			query.equalTo("nome", params.fullName);
			query.startsWith("nome", params.firstName);
		}			
		else{
			if(params.uf)
			query.equalTo("uf", params.uf);
			if(params.siglaPartido){
				if(params.siglaPartido === "PCDOB")
					params.siglaPartido = "PCdoB";
				query.equalTo("siglaPartido", params.siglaPartido);
			}
		}
		query.find({
		  success: function(objects) {
			  var ret = [];
			  var json = {};
			  if(objects.length === 0){		
				
				json.success = false;
				json.message = "Não encontrei nenhum parlamentar com esse nome";
			  }else{
				// Successfully retrieved the object.										
				json.success = true;
				json.qtd = objects.length;
				json.politicos = objects;
				
			  }
			  ret.push(json);
			  callback( ret);
			
		  },
		  error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	/*
	Search a congressman by id
	*/
	getPolitico: function(params, callback){
		var Politico = Parse.Object.extend("Politico");
		var query = new Parse.Query(Politico);
		var ret = [];
		query.get(params.objectId, {
		  success: function(politico) {
			ret.push(politico);
			callback(ret);
		  },
		  error: function(object, error) {
			ret.push(error);
			callback(ret);
		  }
		});

	},
	
	/*
	Get political party´s infos
	*/
	getPartidos: function(params, callback){
		var PartidosNumeros = Parse.Object.extend("PartidosNumeros");
		var query = new Parse.Query(PartidosNumeros);
		if(params.siglaPartido){
			if(params.siglaPartido === "PCDOB")
				params.siglaPartido = "PCdoB";
			query.equalTo("sigla", params.siglaPartido);
		}
		query.ascending("sigla");
		query.find({
		  success: function(objects) {
			  var ret = [];
			  var json = {};
			  
			// Successfully retrieved the object.										
			json.success = true;
			json.qtd = objects.length;
			json.partidos = objects;
				
			  
			ret.push(json);
			callback( ret);
			
		  },
		  error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
		  }
		});

	},
	
	/*
	get congressman spending´s rank 
	params 
		uf - state of congressman
		siglaPartido - parties
		limit - quantity of return´s itens
	*/
	getRanking: function(params, callback){
		var Politico = Parse.Object.extend("Politico");
		var query = new Parse.Query(Politico);
		query.equalTo("tipo", params.casa);
		query.limit(parseInt(params.limit));
		query.skip(parseInt(params.pg));
		if(params.uf)
			query.equalTo("uf", params.uf);
		if(params.siglaPartido){
			if(params.siglaPartido === "PCDOB")
				params.siglaPartido = "PCdoB";
			query.equalTo("siglaPartido", params.siglaPartido);
		}
		query.descending("gastos");
		var ret = [];
		var json = {};
		query.find({
		  success: function(objects) {
			// Successfully retrieved the object.
			
			if(objects.length === 0){		
				json.success = false;
				json.message = "Sem resultado";	
			  }else{
				// Successfully retrieved the object.										
				json.success = true;
				json.qtd = objects.length;
				json.politicos = objects;
			  }
			  ret.push(json);
			  callback( ret);			
		  },
		  error: function(error) {
			json.success = false;
			json.message = "Sem resultado";	
			ret.push(json);
			callback( ret);
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	
	/*
	get congressman spending
	params 
		idPolitico
		ano
	*/
	getGastoAno: function(params, callback){
		var CotaDeputado = Parse.Object.extend("CotaDeputado");
		var query = new Parse.Query(CotaDeputado);
		query.equalTo("id_politico", parseInt(params.idPolitico));	
		query.equalTo("nu_ano", parseInt(params.ano));	
		query.limit(10000);
		
		var meses = [];
		var json = {};
		query.find({
		  success: function(objects) {
			// Successfully retrieved the object.
			
			if(objects.length === 0){		
				json.success = false;
				json.message = "Sem resultado";	
			  }else{
				// Successfully retrieved the object.
				var total = 0;
				for (var i = 0; i < objects.length; i++) {		
					var cota = objects[i];			
					var vmes = cota.get('nu_mes');
					var valor = cota.get('valor');
					total = total +valor;
					
					var position = a.where(meses, {  mes: vmes})
					if(position.length == 0){
						 var j = {  mes: vmes, total: valor };
						 meses.push(j);
					}
					if(position.length > 0){
						 position[0].total = position[0].total + valor;
					}
				}
				
				a.sortBy(meses, ["mes"]);
				json.success = true;
				json.ano = params.ano;
				json.total = total;
				json.meses = JSON.parse(JSON.stringify(meses));
			  }
			  callback( json);			
		  },
		  error: function(error) {
			json.success = false;
			json.message = "Sem resultado";	
			ret.push(json);
			callback( ret);
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	 /*
		Get projects filter by keywords
		params: keywords
	 */
	
	searchProjects : function (params, callback){
		var Politico = Parse.Object.extend("Proposicao");
		var query = new Parse.Query(Politico);
		console.log(params.keys);
		query.containsAll("words", params.keys);	
		//query.limit(10);	
		var ret = [];
		var json = {};
		query.find({
		  success: function(objects) {
			if(objects.length === 0){		
				json.success = false;
				json.message = "Sem resultado";	
			  }else{
				// Successfully retrieved the object.										
				json.success = true;
				json.qtd = objects.length;
				json.projetos = [];
				for (var i = 0; i < objects.length; i++) {
					var projeto = objects[i];
					
					json.projetos.push({"dt_apresentacao":projeto.get("dt_apresentacao"),
							"id_proposicao":projeto.get("id_proposicao"),
							"tx_ultimo_despacho":projeto.get("tx_ultimo_despacho"),
							"updatedAt":projeto.get("updatedAt"),
							"tx_orgao":projeto.get("tx_orgao"),
							"id_autor":projeto.get("id_autor"),
							"tp_casa":projeto.get("tp_casa"),
							"tx_orgao_estado":projeto.get("tx_orgao_estado"),
							"tx_link":projeto.get("tx_link"),
							"id_situacao":projeto.get("id_situacao"),
							"nr_ano":projeto.get("nr_ano"),
							"bl_votou":projeto.get("bl_votou"),
							"tp_proposicao":projeto.get("tp_proposicao"),
							"tx_nome":projeto.get("tx_nome"),
							"txt_ementa":projeto.get("txt_ementa"),
							"dt_ultimo_despacho":projeto.get("dt_ultimo_despacho"),
							"nome_autor":projeto.get("nome_autor"),
							"objectId":projeto.get("objectId")})
				}				
			  }
			  ret.push(json);
			  callback( ret);	
			
		  },
		  error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	/*
	get congressman spending group by category
	params 
		idPolitico
		ano (optional)
		mes (optional)
	*/
	getGastoCategories: function(params, callback){
		
		var classe = "CotaDeputado"
		if(params.casa)
			if(params.casa === 's'){
				classe = "Cota_Senado"
			}
		var CotaDeputado = Parse.Object.extend(classe);
		var query = new Parse.Query(CotaDeputado);	
		query.equalTo("id_politico", parseInt(params.idPolitico));	
		if(params.ano)
			query.equalTo("nu_ano", parseInt(params.ano));	
		else
			params.ano = "todos";
		if(params.mes)
			query.equalTo("nu_mes", parseInt(params.mes));
		else
			params.mes = "todos";
		query.limit(10000);
		
		var subcotas = [];
		var json = {};
		query.find({
		  success: function(objects) {
			// Successfully retrieved the object.
			
			if(objects.length === 0){		
				json.success = false;
				json.message = "Sem resultado";	
			  }else{
				// Successfully retrieved the object.
				var total = 0;
				for (var i = 0; i < objects.length; i++) {		
					var cota = objects[i];			
					var vsubcota = cota.get('subcota');
					var valor = cota.get('valor');
					total = total +valor;
					
					var position = a.where(subcotas, {  subcota: vsubcota})
					if(position.length == 0){
						 var j = {  subcota: vsubcota, total: valor };
						 subcotas.push(j);
					}
					if(position.length > 0){
						 position[0].total = position[0].total + valor;
					}
				}
				
				a.sortBy(subcotas, ["total"]);
				subcotas.reverse();
				json.success = true;
				json.ano = params.ano;
				json.mes = params.mes;
				json.total = total;
				json.subcotas = JSON.parse(JSON.stringify(subcotas));
			  }
			  callback( json);			
		  },
		  error: function(error) {
			json.success = false;
			json.message = "Sem resultado";	
			ret.push(json);
			callback( ret);
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	/*
	get congressman list spending by category
	params 
		idPolitico
		categoria
		ano (optional)
		mes (optional)
	*/
	getListGastosCategories: function(params, callback){
		var CotaDeputado = Parse.Object.extend("CotaDeputado");
		var query = new Parse.Query(CotaDeputado);
		query.equalTo("id_politico", parseInt(params.idPolitico));	
		query.equalTo("subcota", params.subcota);	
		if(params.ano)
			query.equalTo("nu_ano", parseInt(params.ano));	
		else
			params.ano = "todos";
		if(params.mes)
			query.equalTo("nu_mes", parseInt(params.mes));
		else
			params.mes = "todos";
		query.limit(10000);
		query.ascending('nu_ano,nu_mes');
		
		var json = {};
		query.find({
		  success: function(objects) {
			// Successfully retrieved the object.
			
			if(objects.length === 0){		
				json.success = false;
				json.message = "Sem resultado";	
			  }else{
				// Successfully retrieved the object.
				var total = 0;
				for (var i = 0; i < objects.length; i++) {		
					var cota = objects[i];			
					var valor = cota.get('valor');
					total = total +valor;
				}
				json.success = true;
				json.ano = params.ano;
				json.mes = params.mes;
				json.subcota = params.subcota;				
				json.total = total;			
				json.qtd = objects.length;
				json.gastos = JSON.parse(JSON.stringify(objects));
			  }
			  callback( json);			
		  },
		  error: function(error) {
			json.success = false;
			json.message = "Sem resultado";	
			ret.push(json);
			callback( ret);
			console.log("Error: " + error.code + " " + error.message);
		  }
		});
	},
	
	
	/*
		 Get congressman projects
		params: politicoId, nome
	 */
	
	getProjects : function (params, callback){		
		
		//var json = params[0];
		var Proposicao = Parse.Object.extend("Proposicao");
		var query = new Parse.Query(Proposicao);
		query.equalTo("autor", "Politico$"+params.politicoId);	
		query.limit(10);	
		query.find({
		  success: function(objects) {
			// Successfully retrieved the object.
			var cards = [];
			for (var i = 0; i < objects.length; i++) {
				var object = objects[i];
				cards.push(Monitora.buildElementProject(object));
			}
			callback(cards);
			
		  },
		  error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
		  }
		});		
	},
	
	
	
	/* 
		get congressman´s gender 
		can be (o) -> male
		or (a) -> female
	*/
	
	getGender: function (gender){
		if(gender === "masculino")
			return "o";
		return "a";
	},
	
	/* 
		get congressman´s gender 
		can be (o) -> male
		or (a) -> female
	*/
	
	cutCategory: function (cat){
		cat = cat.replace("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR",'Manutenção de escritório');
		cat = cat.replace("CONSULTORIAS PESQUISAS E TRABALHOS TÉCNICOS",'Consultorias, pesquisas e trab. técn.');
		cat = cat.replace("DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR",'Divulgação de ativid. parlam.');
		return cat;
	}
};

module.exports = Monitora;
