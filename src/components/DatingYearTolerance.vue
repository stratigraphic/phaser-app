<template>
	<b-input-group prepend="±" class="shadow-sm">
        <b-form-input number  
            min="0"                            
            :disabled="disabled"
            placeholder="tolerance"
            type="number" 
            :value="local.tolValue"
            @change="changed('tolValue', $event)"/>
        <b-input-group-append>
            <b-form-select 
                :value="local.tolUnit"
                :options="tolTypes" 
                :disabled="disabled" 
                @change="changed('tolUnit', $event)"/>
        </b-input-group-append>
    </b-input-group>   
</template>

<script>

export default {
	name: 'DatingYearTolerance',
	components: {
		//MyComponent 
	},
	mixins: [ ],	
	props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},		   
        tolerance: {
            type: Object,
			required: false,
			default: null
        }			
	},
	data() {		
		return {
            tolTypes: [{ value: 'percent', text: '%' }, { value: 'years', text: 'years' }],
            tolValue: this.tolerance?.tolValue,            
            tolType: this.tolerance?.tolType?.toString().trim().toLowerCase()
		}
	},
	computed: {
		local() {
            return {
                tolValue: this.tolerance?.tolValue || 0,  
                tolUnit: this.tolerance?.tolUnit || "years"
            }
		}
	},
	methods: {
		changed(key, value) {
			this.$emit('change', { ...this.tolerance, [key]: value })	
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
