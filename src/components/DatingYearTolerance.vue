<template>
	<b-input-group prepend="±" class="shadow-sm" size="sm">
        <b-form-input number 
			size="sm" 
            min="0"                            
            :disabled="disabled"
            placeholder="tolerance"
            type="number" 
            :value="toleranceValue"
            @change="valueChanged"/>
        <b-input-group-append>
            <b-form-select 
				size="sm"
                :value="toleranceUnit"
                :options="tolUnits" 
                :disabled="disabled" 
                @change="unitChanged"/>
        </b-input-group-append>
    </b-input-group>   
</template>

<script>
//import { ref } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { tryParseInt } from '@/composables/PhaserCommon'

export default {		
	props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},		   
        toleranceValue: {
            type:Number,
			required: false,
			default: 0
        },
		toleranceUnit: {
			type: String,
			required: false,
			default: 'years',
			validator: (value) => ["years", "percent"].indexOf(value) !== -1			
		}			
	},
	setup(props, context) {
		const tolUnits = [{ value: 'years', text: 'years' }, { value: 'percent', text: '%' }]
		//const tolUnit = ref(props.toleranceUnit.trim().toLowerCase())
		//const tolValue = ref(props.toleranceValue) 
		//const combined = computed(() => `${tolValue.value} ${tolUnit.value}`)
		// https://learnvue.co/2021/05/a-guide-to-vue-emit-how-to-emit-custom-events-in-vue/
		const valueChanged = (newValue) => context.emit('change-value', tryParseInt(newValue, 0))
		const unitChanged = (newUnit) => context.emit('change-unit', newUnit)
		
		return {
			//tolUnit,
			//tolValue,
			//combined,
			tolUnits,
			valueChanged, 
			unitChanged
		}
	}
}
</script>