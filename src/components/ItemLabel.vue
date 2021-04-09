<template>
	<b-form-group
		:label="label" 
		label-for="itemLabel">	
		<b-form-input text 
            :id="uniqueId"
			:disabled="disabled"
            :placeholder="placeholder"
            :value="value"
            class="shadow-sm"		
			type="text"
			name="itemLabel"            
			autocomplete="off"  
            @input="changed"/>
	</b-form-group>
</template>

<script>
import _uniqueId  from 'lodash/uniqueId'

export default {
	name: 'ItemLabel',
	components: { },
	mixins: [ ],
	props: {
        id: {
            type: String,
            required: false,
			default: null
        },
		disabled: {
			type: Boolean,
			required: false,
			default: false 
		},
        placeholder: {
            type: String,
			required: false,
			default: ""
        },
        value: {
            type: String,
			required: false,
			default: ""
        },
		label: {
            type: String,
			required: false,
			default: "Identifier"
        }
	},
	data() {
		return { }
	},
	computed: { 
        uniqueId() {
            return this.id || _uniqueId("itemlabel-")
        },   
    },
	methods: {
        changed(value) {
            this.$emit('input', value)
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
