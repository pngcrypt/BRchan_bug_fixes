// ==UserScript==
// @name         BRchan bug fixes
// @namespace    https://www.brchan.org/
// @version      1.1.0
// @author       pngcrypt
// @include      http*://www.brchan.org/*
// @include      http*://brchan.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==


// some fixes for some pages (by url-regex)
(function() {
'use strict';

	var msg = function() {
		window.console.log.apply(window.console, ["[BRfix]"].concat(Array.from(arguments)));
	};

	var storage_name = "BRbugFix",
		storage = {},
		fn_url='',

		// url regex: if matched function will be called: fixes.$1() -- where $1 - is 1st catch-group of regex
		url_match = [
			[/mod\.php\?\/(settings)\//],
			[/\/(res)\//],
			[/\/(ban)(&delete)?\//],
			[/^(report)\.php/]
		];

	var loadStorage = function() {
		try {
			storage = JSON.parse(localStorage.getItem(storage_name));
		} catch(err) {}
		if(!storage)
			storage = {};
	};

	var saveStorage = function() {
		try {
			localStorage.setItem(storage_name, JSON.stringify(storage));
		} catch(err) {
			msg('ERROR storage saving');
		}
	};

	var loadForms = function(forms) {
		/*
			load saved fields for forms from localStorage

			forms = {
				'form1': {
					'field1': 'def-val1',
					...
					'filedN': 'def-valN'
				},
				...
				'formN': {...}
			}

			'formN' - selector of form
			'fieldN' - selector of field
			'def-valN' - default value (if not found in storage)
		*/

		if(!storage[fn_url]) 
			storage[fn_url] = {};
		if(!storage[fn_url].forms)
			storage[fn_url].forms = {};

		var st_forms = storage[fn_url].forms,
			val, form, field;

		for(let f in forms) {
			form = document.querySelector(f);
			if(!form) {
				msg('loadForms: Form not found:', f);
				continue;
			}
			for(let fl in forms[f]) {
				field = form.querySelector(fl);
				if(!field || !('value' in field)) {
					msg('loadForms: bad field: ['+f+'].'+fl);
					continue;
				}
				if(!(f in st_forms)) st_forms[f] = {};
				if(fl in st_forms[f])
					field.value = st_forms[f][fl];
				else {
					field.value = st_forms[f][fl] = forms[f][fl];
				}
			}
		}

		// delete not used fields from storage
		for(let f in st_forms) {
			if(!(f in forms)) {
				delete st_forms[f];
				continue;
			}
			for(let fl in st_forms[f]) {
				if(!(fl in forms[f]))
					delete st_forms[f][fl];
			}
		}
		return st_forms;
	};

	var saveForm = function(form, fn) {
		// save fileds on submit
		var f = document.querySelector(form);
		if(!f || !('onsubmit' in f)) {
			msg("saveForm: Form not found or it is not form: ", f);
			return;
		}
		var st_form = storage[fn_url];
		if(!st_form || !st_form.forms || !(form in st_form.forms)) {
			msg("saveForm: Form not was loaded:", f);
			return;			
		}
		st_form = st_form.forms[form];
		var old_submit = f.onsubmit;
		f.onsubmit = function(e) {
			if(typeof(fn) == 'function')
				fn(e);
			else {
				let v;
				for(let fl in st_form) {
					v = f.querySelector(fl);
					if(v && ('value' in v))
						st_form[fl] = v.value;
				}
				saveStorage();
			}
			if(old_submit)
				old_submit(e);
		};
	};


	// fixes functions
	var fixes = {
		//----------------------
		settings: function() 
		//----------------------
		{
			var inputs_add = [
				["8archive", 1],
			];

			var inputs_del = [
				"meta_noindex"
			];
			var inp,el;

			// remove buggy inputs
			inp = document.querySelectorAll('input, select');
				for(let i of inp) {
					for(let id of inputs_del)
						if(i.name && i.name == id) {
							i.remove();
						}
				}

			// add new inputs
			inp = document.querySelector('form');
			for(let i of inputs_add) {
				el = document.createElement('input');
				el.type = 'hidden';
				el.name = i[0];
				el.value = i[1];
				inp.appendChild(el);
			}

			// remove dup filters
			el = document.querySelectorAll('input[name="replace[]"]');
			inp = [];
			for(let i of el) inp.push(i);
				for(let i=0; i<inp.length-1; i++) {
					if(inp[i]) for(let j=i+1; j<inp.length; j++) {
						if(inp[j] && inp[i].value === inp[j].value) {
							inp[j].parentElement.parentElement.remove(); // tr
							inp[j] = undefined;
						}
					}
				}
		},

		//----------------------
		res: function()
		//----------------------
		{
			// delete file name before posting
			window.$(document).on('ajax_before_post', function(e, formData) {
				for(let n=1; n<10; n++) {				
					let fname = 'file' + (n < 2 ? '' : n);
					let files = formData.getAll(fname);
					if(!files.length)
						break;
					formData.delete(fname);
					for(let f of files) {
						if(!f || !f.size)
							continue;
						formData.append(fname, f, f.name.replace(/^.*(\.[^.]+)$/, '$1'));
					}
				}
			});
		},

		//----------------------
		ban: function() 
		//----------------------
		{
			loadForms({
				'form': {
					'#reason': '',
					'#length': ''
				}
			});
			saveForm('form');
		},

		//----------------------
		report: function() 
		//----------------------
		{
			loadForms({
				'form': {
					'#reason': ''
				}
			});
			saveForm('form');
		},
	};


	var url = document.head.querySelector('title');
	if(url && url.innerText.match('CloudFlare')) {
		return;
	}

	url = window.location.pathname.substr(1) + window.location.search;
	for(let u of url_match) {
		let m = url.match(u[0]);
		if(m) {
			fn_url = m[1] || u[1];
			if(fn_url && (fn_url in fixes)) {
				msg(u[0], ': '+fn_url+'()');
				loadStorage();
				fixes[fn_url]();
			}
			else
				msg('ERROR: no function for ', u[0]);
		}
	}

})();