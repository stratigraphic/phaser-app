<template>
    <b-form-group class="px-2 shadow-sm"  label="">
        <b-form-row>             
            <b-col> 
                <b-form-group 
                    valid-feedback=""
                    :invalid-feedback="validationMessage"
                    :state="validateMinYear">            
                    <b-form-group class="my-2"
                        label="Minimum (earliest) Year"
                        label-for="minYearInput">
                        <b-form-input number 
                            :disabled="disabled" 
                            placeholder="Minimum year"
                            name="minYearInput" 
                            class="shadow-sm"
                            type="number" 
                            :value="local.minYear" 
                            @change="changed('minYear', $event)"/>
                    </b-form-group>
                    <DatingYearTolerance v-if="showTolerances"
                        :disabled="disabled"
                        :tolerance-value="local.minYearTolValue" 
                        :tolerance-unit="local.minYearTolUnit"             
                        @change-value="changed('minYearTolValue', $event)"
                        @change-unit="changed('minYearTolUnit', $event)" />                                  
                </b-form-group>
            </b-col> 
            <b-col>
                <b-form-group  
                    valid-feedback=""
                    :invalid-feedback="validationMessage"
                    :state="validateMaxYear">
                    <b-form-group class="my-2"
                        label="Maximum (latest) year"
                        label-for="maxYearInput">
                        <b-form-input number 
                            :disabled="disabled"
                            placeholder="Maximum year" 
                            class="shadow-sm"
                            name="maxYearInput" 
                            type="number" 
                            :value="local.maxYear"
                            @change="changed('maxYear', $event)"/>
                    </b-form-group>
                    <DatingYearTolerance v-if="showTolerances"
                        :disabled="disabled"
                        :tolerance-value="local.maxYearTolValue" 
                        :tolerance-unit="local.maxYearTolUnit"             
                        @change-value="changed('maxYearTolValue', $event)"
                        @change-unit="changed('maxYearTolUnit', $event)" />                     
                </b-form-group>
            </b-col>       
       </b-form-row>         
    </b-form-group>
</template>

<script>
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import DatingYearTolerance from '@/components/DatingYearTolerance'

export default {	
	components: {
        DatingYearTolerance
	},	
	props: { 
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },       
        dating: {
            type: Object,
			required: false,
			default: null
        },
        showTolerances: {
            type: Boolean,
            required: false,
            default: true
        }		
    },  	
    setup(props, context) {
        const currentYear = new Date().getFullYear()

        const local = computed(() => {
            return {
                //minYear: Number((props.dating || {}).minYear),  
                minYear: Number(props.dating?.minYear || null),  
                maxYear: Number(props.dating?.maxYear || null),  
                minYearTolValue: Number(props.dating?.minYearTolValue),  
                maxYearTolValue: Number(props.dating?.maxYearTolValue),  
                minYearTolUnit: props.dating?.minYearTolUnit || "years",
                maxYearTolUnit: props.dating?.maxYearTolUnit || "years"
            }
        })
        
        const validateMinYear = computed(() => {
            return (!Number.isNaN(Number(local.value.minYear)))
                && local.value.minYear <= local.value.maxYear
                && local.value.minYear <= currentYear
        })
        const validateMaxYear = computed(() => {
            return (!Number.isNaN(Number(local.value.maxYear)))
                && local.value.minYear <= local.value.maxYear
                && local.value.maxYear <= currentYear
        }) 
        const validationMessage = computed(() => {
            if(Number.isNaN(Number(local.value.minYear)))
                return "Please enter a valid year"
            if(Number.isNaN(Number(local.value.maxYear)))
                return "Please enter a valid year"
            else if(local.value.minYear > local.value.maxYear) 
                return "Min year cannot exceed max year"
            else if(local.value.minYear > currentYear)
                return "Min year cannot exceed current year"
            else
                return "something else wrong"
        })            
        const changed = (key, value) => {
            context.emit('change', { ...props.dating, [key]: value })
        }  
        return {
			local, 
            validateMinYear, 
            validateMaxYear,  
            validationMessage,             
            changed
        }   
    }	
}
</script>

<style scoped>
</style>
