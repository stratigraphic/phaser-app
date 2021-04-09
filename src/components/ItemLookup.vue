<template>
    <div>
        <b-form-group v-if="mode == 'select'"
            :label="this.label"
            label-for="itemSelector">
            <b-form-select 
                :disabled="this.disabled"
                name="itemSelector" 
                class="shadow-sm"
                :placeholder="placeholder"
                :value="value"
                :options="optionsForSelect" 
                @change="changed($event)"/>
        </b-form-group>	
        <b-form-group v-else  
            :label="this.label"
            label-for="itemInput">
            <b-form-input text
                :disabled="this.disabled"
				name="itemInput" 
                class="shadow-sm" 
                :placeholder="placeholder"
                :value="value"
				type="text" 
				:list="optionsId" 
				autocomplete="off"
                @change="changed($event)"/>
			<b-form-datalist :id="optionsId" :options="optionsForInput"/>
			<!--	<option v-for="(value, index) in optionsForInput" :key="index">{{ value }}</option>
			</b-form-datalist>-->
		</b-form-group>       
    </div>
</template>

<script>
import _uniqueId  from 'lodash/uniqueId'

export default {
	name: 'ItemLookup',
	components: { },
	mixins: [ ],
	props: {
        // enables/disables the composite control
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },  
        // label for the composite control      
        label: {
            type: String, 
            required: false,
            default: "Select item"
        },
        // text to display if nothing is input
        placeholder: {
            type: String, 
            required: false,
            default: ""
        },
        value: {
            type: String
        },
        // Adds option '(none)' to the lookup options if true
        optionNone: {
            type: Boolean,
            required: false,
            default: true
        },
        // whether to display as select with options or input with suggestions
        mode: {
            type: String, // "select | "input"
            required: false,
            default: "select",
            validator: value => ["select", "input"].includes(value)   
        },
        // options to display
		options: { 
			type: Array, // expected format: [{id: "x", label: "xx"}, {id: "y", label: "yy"}]
			required: false,
			default: () => []
		}		
	},
	data() {
		return {}
	},
	computed: {	
        // unique id for datalist to allow component reuse
        optionsId() {
            return _uniqueId("datalist-")
        },        
        optionsForSelect() {
            return this.options
                .concat(this.optionNone ? [{ value: "", text: "(none)", selected: true }] : [])                
                .sort((a, b) => (a.text || a.value || "") > (b.text || b.value || "") ? 1 : -1)
        },
		optionsForInput() {
            return this.options
                .map(item => item.text || "")
                .filter(item => item)
                .sort((a,b) => a > b ? 1 : -1)              
        }
	},
	methods: {        
        changed(value){
            this.$emit('change', value)
        }
    },
	// lifecycle hooks
	beforeCreate() {},
	created() {},
	beforeMount() {},
	mounted() {},
	beforeUpdate() {},
	updated() {},
	beforeDestroy() {},
	destroyed() {}
}
</script>

<style scoped>

</style>