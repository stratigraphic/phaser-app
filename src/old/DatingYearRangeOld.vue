<template>
    <b-form-group class="px-2 shadow-sm"  label="">
        <b-form-row>             
            <b-col> 
                <b-form-group 
                    valid-feedback=""
                    :invalid-feedback="minYearInvalid"
                    :state="minYearValidation">            
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
                    <b-input-group v-if="showTolerances" prepend="±" class="shadow-sm">
                        <b-form-input number  
                            min="0"                            
                            :disabled="disabled"
                            placeholder="tolerance"
                            type="number" 
                            :value="local.minYearTolValue"
                            @change="changed('minYearTolValue', $event)"/>
                        <b-input-group-append>
                            <b-form-select 
                                :value="local.minYearTolUnit"
                                :options="tolTypes" 
                                :disabled="disabled" 
                                @change="changed('minYearTolUnit', $event)"/>
                        </b-input-group-append>
                    </b-input-group>                
                </b-form-group>
            </b-col> 
            <b-col>
                <b-form-group  
                    valid-feedback=""
                    :invalid-feedback="maxYearInvalid"
                    :state="maxYearValidation">
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
                    <b-input-group v-if="showTolerances" prepend="±" class="shadow-sm" >
                        <b-form-input number 
                            min="0"
                            :disabled="disabled"
                            placeholder="tolerance"
                            type="number" 
                            :value="local.maxYearTolValue"
                            @change="changed('maxYearTolValue', $event)"/>
                        <b-input-group-append>
                            <b-form-select 
                                :value="local.maxYearTolUnit"
                                :options="tolTypes" 
                                :disabled="disabled" 
                                @change="changed('maxYearTolUnit', $event)"/>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>
            </b-col>       
       </b-form-row>         
    </b-form-group>
</template>

<script>

export default {
	name: 'DatingYearRange',
	components: {
        //DatingYearTolerance
	},
	mixins: [ ],
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
	data() {
		return {
            tolTypes: [{ value: 'percent', text: '%' }, { value: 'years', text: 'years' }]            
		}
	},
	computed: { 
        local() {
            return {
                minYear: Number((this.dating || {}).minYear),  
                maxYear: Number((this.dating || {}).maxYear),  
                minYearTolValue: Number((this.dating || {}).minYearTolValue),  
                maxYearTolValue: Number((this.dating || {}).maxYearTolValue),  
                minYearTolUnit: (this.dating || {}).minYearTolUnit || "years",
                maxYearTolUnit: (this.dating || {}).maxYearTolUnit || "years"
            }
        },               
        currentYear() {
            return new Date().getFullYear()
        },
        minYearValidation() {
            return (!Number.isNaN(Number(this.local.minYear)))
                && this.local.minYear <= this.local.maxYear
                && this.local.minYear <= this.currentYear
        },
        maxYearValidation() {
            return (!Number.isNaN(Number(this.local.maxYear)))
                && this.local.minYear <= this.local.maxYear
                && this.local.maxYear <= this.currentYear
        },
        minYearInvalid() {  
            if(Number.isNaN(Number(this.local.minYear)))
                return "Please enter a valid year"
            else if(this.local.minYear > this.local.maxYear) 
                return "Min year cannot exceed max year"
            else if(this.local.minYear > this.currentYear)
                return "Min year cannot exceed current year"
            else
                return "something else wrong"
        },
        maxYearInvalid() {  
            if(Number.isNaN(Number(this.local.maxYear)))
                return "Please enter a valid year"
            else if(this.local.minYear > this.local.maxYear) 
                return "Min year cannot exceed max year"
            else if(this.local.maxYear > this.currentYear)
                return "Max year cannot exceed current year"
            else
                return "something else wrong"
        }     
	},
	methods: {  
        changed(key, value) {
        //changed() {
            /*let newDating = {
                minYear: Number.parseInt((this.dating || {}).minYear) || 0,  
                maxYear: Number.parseInt((this.dating || {}).maxYear) || 0,  
                minYearTolValue: Number.parseInt((this.dating || {}).minYearTolValue) || 0,  
                maxYearTolValue: Number.parseInt((this.dating || {}).maxYearTolValue) || 0,  
                minYearTolUnit: ((this.dating || {}).minYearTolUnit || "years").toString().trim(),
                maxYearTolUnit: ((this.dating || {}).maxYearTolUnit || "years").toString().trim(),                                
            } */
            this.$emit('change', { ...this.dating, [key]: value })
            //this.$emit('change', newDating);	
        },
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
