<template>
    <div>
        <DatingYearCE :year="year1" @change="changed1($event)"/><span>{{ `year=${year1}` }}</span>
        <DatingYearCE :year="year2" @change="changed2($event)"/><span>{{ `year=${year2}` }}</span>
        <DatingYearCE :year="year3" @change="changed3($event)"/><span>{{ `year=${year3}` }}</span>
    </div>    
</template>

<script>
import { ref } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import DatingYearCE from '@/components/DatingYearCE'

export default {
    components: {DatingYearCE},	
	setup() {        
        const year1 = ref(1900)
        const year2 = ref(-1900)
		const year3 = ref(0)
        
        const changed1 = value => {console.log(value); year1.value = value }      
		const changed2 = value => year2.value = value
        const changed3 = value => year3.value = value    

		return { year1, year2, year3, changed1, changed2, changed3 }
	}
}
</script>
