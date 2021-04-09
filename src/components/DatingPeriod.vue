<template>
    <div>
        <b-form-group label="Period" label-for="periodSelector">
            <b-form-select 
                :disabled="this.disabled"
                name="periodSelector" 
                class="shadow-sm"                
                :value="value"
                :options="options" 
                @change="changed($event)"/>
        </b-form-group>	
    </div>
</template>

<script>
import PhaserCommon from '@/mixins/PhaserCommon.js'

export default {
	name: 'ComponentTemplate',
	components: {},
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
        }		
	},
	data() {
		return {            
            options: [],
            value: ""			
		}
	},
	computed: {	},
	methods: {
        changed(){}
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
