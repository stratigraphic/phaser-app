<template>
    <b-card no-body 
        v-b-toggle.legendItems             
        class="card text-secondary shadow" 
        style="{ cursor: 'pointer' }">
        <div class="card-header px-3 py-1">
            <b-icon-key class="mr-2"/>Key</div>
            <b-collapse id="legendItems" class="card-body m-0 px-3 py-1">               
            <b-list-group flush class="bg-light">
                <b-list-group-item v-for="(item, index) in items" :key="index" class="m-0 p-0 border-0">
                    <svg height="15" width="30">
                        <rect x="1" y="1" 
                            width="28" height="11" 
                            stroke-width="1" 
                            :fill="item.fillColor" 
                            :stroke="item.borderColor"
                            :stroke-dasharray="item.dashed ? '2 2' : ''"/>                                
                    </svg>
                    <span class="ml-1">{{item.label}}</span>
                </b-list-group-item>                        
                <!--
                <b-list-group-item class="m-0 p-0 border-0">
                    <svg height="15" width="25">
                         <circle cx="12" cy="7.5" r="7" stroke="red" stroke-width="1" fill="pink" />                               
                    </svg>
                    <span class="ml-1">Find</span>
                </b-list-group-item>
                <b-list-group-item class="m-0 p-0 border-0">
                    <svg height="15" width="25">
                        <polygon points="4,15 12,0 20,15" stroke="purple" stroke-width="1" fill="plum" />                               
                    </svg>
                    <span class="ml-1">Sample</span>
                </b-list-group-item>
                -->
            </b-list-group>                    
        </b-collapse>
    </b-card>    
</template>

<script>

export default {
	name: 'Legend',
	components: {},
	mixins: [],
	props: {},
	data() {
        return {
            items: [
                { label: "Phase", fillColor: "transparent", borderColor: "red", dashed: true },
                { label: "Group", fillColor: "honeydew", borderColor: "green" },
                { label: "Sub-Group", fillColor: "aliceblue", borderColor: "blue" },
                { label: "Context", fillColor: "white", borderColor: "black" },
                { label: "Selected", fillColor: "gold", borderColor: "black" },
            ],
        }
    },
	computed: {},
	methods: {},
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