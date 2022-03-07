<template>
    <b-form-group class="px-2 shadow-sm"  label="">
        <b-form-row>             
            <b-col> 
                <b-form-group 
                    valid-feedback=""
                    :invalid-feedback="validationMessage"
                    :state="validateMinYear">
                    <DatingYearCE 
                        label="Minimum (earliest) Year" 
                        :disabled="disabled" 
                        placeholder="Minimum year"
                        name="minYearInput" 
                        :year="local.minYear"
                        @change="changed('minYear', $event)"/>
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
                    <DatingYearCE 
                        label="Maximum (latest) year" 
                        :disabled="disabled" 
                        :year="local.maxYear"                        
                        placeholder="Maximum year"
                        name="maxYearInput" 
                        @change="changed('maxYear', $event)"/>
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
import DatingYearCE from '@/components/DatingYearCE'

export default {	
	components: {
        DatingYearCE,
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
			default: () => { return {}}
        },        
        showTolerances: {
            type: Boolean,
            required: false,
            default: true
        }		
    },
    setup(props, context) {
        const currentYear = new Date().getFullYear()
        //console.log(props)
        //const minYear = computed(() => Number(props.dating.minYear || null))
     
        //const minYear = Number(props.dating.minYear || null)
        
        const local = computed(() => {
            const dating = (props.dating || {})
            return {
                minYear: Number(dating["minYear"] || null),  
                maxYear: Number(dating["maxYear"] || null),  
                minYearTolValue: Number(dating["minYearTolValue"] || 0),  
                maxYearTolValue: Number(dating["maxYearTolValue"] || 0),  
                minYearTolUnit: dating["minYearTolUnit"] || "years",
                maxYearTolUnit: dating["maxYearTolUnit"] || "years"
            }
        })
        
        const validateMinYear = computed(() => {
            return (Number.isInteger(local.value.minYear))
                && local.value.minYear <= local.value.maxYear
                && local.value.minYear <= currentYear
        })

        const validateMaxYear = computed(() => {
            //return (!isNaN(local.maxYear))
            return (Number.isInteger(local.value.maxYear))
                && local.value.minYear <= local.value.maxYear
                && local.value.maxYear <= currentYear
        }) 

        const validationMessage = computed(() => {
            if(!Number.isInteger(local.value.minYear)) 
                return "Please enter a valid year"
            if(!Number.isInteger(local.value.maxYear))              
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
