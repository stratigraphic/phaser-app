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

	<DatingYearRange v-else
        :disabled="disabled"
        :dating="dating"
        @change="datingChanged"/>
	</div>
</template>

<script>
import PhaserCommon from '@/mixins/PhaserCommon.js'
import DatingYearRange from '@/components/DatingYearRange.vue'
import SciDatingFields from '@/components/SciDatingFields.vue'
//import DatingPeriod from '@/components/DatingPeriod.vue'

export default {
	name: 'Dating',
	components: {
		DatingYearRange,
		SciDatingFields
        //DatingPeriod
	},
	mixins: [ PhaserCommon ],
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
	data() {
		return {}
	},
	computed: {},
	methods: {
        datingChanged(newValue){
			this.$emit('change', newValue)
		},
		checkboxChanged(value) {
			if(this.dating) {
				let d = Object.assign({}, this.dating)
				d.isSciDating = value
				this.datingChanged(d)
			}
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