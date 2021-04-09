import _capitalize  from 'lodash/capitalize'

const PhaserCommon = {
    data: function() {
        return {}
    }, 
    methods: {
        getJSON(uri, success=()=>{}, error=()=>{}) {
           /* let options = {
                method: 'GET', 
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                } 
            }
            fetch(uri, options)*/
            fetch(uri)
                .then(response => response.json())
                .then(success)
                .catch(error)
        },
        
        capitalize(str){
			return _capitalize(str)
		},
        utf8_hex: function(str) {
            return Array.from(str).map(c => 
                c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16).padStart(2, '0') :
                encodeURIComponent(c).replace(/%/g,'').toLowerCase()
            ).join('');
        },
        hex_utf8: function(hex) {
            return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'));
        }
    }
}
export default PhaserCommon
