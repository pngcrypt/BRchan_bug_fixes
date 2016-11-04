// ==UserScript==
// @name         BRchan bug fixes
// @namespace    https://www.brchan.org/
// @version      1.0.0
// @author       pngcrypt
// @include      http*://www.brchan.org/mod.php?/settings/*
// @include      http*://brchan.org/mod.php?/settings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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
        let el = document.createElement('input');
        el.type = 'hidden';
        el.name = i[0];
        el.value = i[1];
        inp.append(el);
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

})();