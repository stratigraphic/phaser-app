<template>
	<div>
		<b-form-checkbox switch
			id="sciDating"
			name="sciDating"			
			:disabled="disabled"
			:checked="(dating || {}).isSciDating" 
			:value="true"
			:unchecked-value="false" 
			@change="checkboxChanged">Scientific dating?</b-form-checkbox>
				
	<!--<b-tabs>        
        <b-tab title="Year range">
            <DatingYearRange
                :disabled="disabled"
                :dating="dating"
                :showTolerances="false"
                @change="datingChanged"/>	
		</b-tab>
        <b-tab title="Period">
            <DatingPeriod
                :disabled="disabled"
                :dating="dating"                
                @change="datingChanged"/>
            <DatingYearRange
                :disabled="true"
                :dating="dating"
                :showTolerances="false"/>
        </b-tab>
        <b-tab title="Probability range">
            <DatingYearRange
                :disabled="disabled"
                :dating="dating"
                @change="datingChanged"/>
        </b-tab>
	</b-tabs>-->
	
	<SciDatingFields v-if="(dating || {}).isSciDating"
		:disabled="disabled"
        :dating="dating"
        @change="datingChanged"/>

	<DatingYearRangeCE v-else
        :disabled="disabled"
        :dating="dating"
        @change="datingChanged"/>
	</div>
</template>

<script>
import DatingYearRangeCE from '@/components/DatingYearRangeCE'
import SciDatingFields from '@/components/SciDatingFields'

export default {
	components: {
		DatingYearRangeCE,
		SciDatingFields        
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
	},
	setup(props, context) {
		const datingChanged = (newValue) => context.emit('change', newValue)
		
		const checkboxChanged = (value) => {
			if(props.dating) {
				let d = Object.assign({}, props.dating)
				d.isSciDating = value
				datingChanged(d)
			}
		}
		
		return { datingChanged, checkboxChanged }
    }
}
</script>