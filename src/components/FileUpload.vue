<template>
  <div class="file-upload-wrapper">
    <div class="file-upload">
      <div class="file-upload-header">
        <h3>Adicione o arquivo:</h3>
      </div>
      <div class="file-upload-container">
        <label for="file-input" class="custom-file-input">
          <i class="fas fa-upload"></i> Escolher Arquivo
        </label>
        <input id="file-input" type="file" @change="handleFileUpload" class="file-input">
        <span v-if="file" class="file-name">{{ file.name }}</span>
      </div>
      <button @click="uploadFile" class="upload-button"
        :disabled="!file || file.name === lastUploadedFileName || invalidFileFormat"
        :class="{ 'disabled': !file || file.name === lastUploadedFileName || invalidFileFormat }">
        <i class="fas fa-paper-plane"></i> Mostrar dados
      </button>

      <p v-if="invalidFileFormat" class="error-message">Por favor, adicione o formato correto (.xlsx ou .csv).</p>
    </div>

    <div v-if="!response">
      <div class="dashboard">
        <h3>Dashboard</h3>
        <p v-if="invalidFormat" style="color: red;">Por favor, adicione o formato correto (.xlsx ou .csv).</p>
        <p v-else>Selecione um arquivo para ver os dados.</p>
      </div>
    </div>
    <div v-else>
      <div class="dashboard">
        <h3>Dashboard</h3>
        <div v-if="response">
          <div class="card-container">
            <div class="card">
              <div class="card-header">
                <h4>MRR Total</h4>
              </div>
              <div class="card-body">
                <div class="chart-container" ref="mrrChart"></div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h4>Churn Rate Total</h4>
              </div>
              <div class="card-body">
                <div class="chart-container" ref="churnRateChart"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ApiService from '@/services/ApiService';
import '@fortawesome/fontawesome-free/css/all.css';
import * as d3 from 'd3';
import ElementReadyDirective from "@/directives/ElementReadyDirective";

export default {
  name: 'FileUpload',
  directives: {
    ElementReadyDirective
  },
  data() {
    return {
      file: null,
      lastUploadedFileName: null,
      response: null,
      invalidFormat: false,
      invalidFileFormat: false
    };
  },
  mounted() {
    if (this.response) {
      this.createCharts(this.response);
    }
  },
  methods: {
    handleFileUpload(event) {
      const newFile = event.target.files[0];
      if (newFile) {
        if (newFile.name.endsWith('.xlsx') || newFile.name.endsWith('.csv')) {
          this.invalidFileFormat = false; // Arquivo no formato correto
        } else {
          this.invalidFileFormat = true; // Arquivo não está no formato correto
        }
      }
      if (!this.file || this.file.type !== newFile.type) {
        // Limpar dados anteriores
        this.response = null;
        this.lastUploadedFileName = null;
      }

      this.file = newFile;
    },
    uploadFile() {
      if (!this.file || this.invalidFileFormat) { // Verifica se o arquivo é inválido
        this.response = null;
        console.log('Por favor, adicione o formato correto (.xlsx ou .csv).', this.invalidFileFormat);
        return;
      }
      this.lastUploadedFileName = this.file.name;
      let formData = new FormData();
      formData.append('file', this.file, this.file.name);

      ApiService.uploadFile(formData)
        .then(response => {
          this.response = response.data;
          this.createCharts(response.data);
        })
        .catch(error => {
          console.error('Erro ao enviar o arquivo:', error);
        });
    },
    createCharts(data) {
      const waitForElements = async () => {
        await this.$nextTick();

        // Remover gráficos antigos
        d3.select(this.$refs.mrrChart).select("svg").remove();
        d3.select(this.$refs.churnRateChart).select("svg").remove();

        // Criar novos gráficos
        this.createChart(data.monthly_metrics, 'mrr', '', this.$refs.mrrChart);
        this.createChart(data.monthly_metrics, 'churn_rate', '', this.$refs.churnRateChart);
      };

      waitForElements();
    },

    createChart(data, key, title, element) {
      const chartData = Object.entries(data).map(([month, metrics]) => {
        return { month, value: metrics[key] };
      });

      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const width = element.offsetWidth - margin.left - margin.right;
      const height = element.offsetHeight - margin.top - margin.bottom;

      // Remove o conteúdo anterior do elemento
      d3.select(element).select("svg").remove();

      const svg = d3.select(element)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const x = d3.scaleBand()
        .domain(chartData.map(d => d.month))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value)])
        .nice()
        .range([height, 0]);

      svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

      svg.append('g')
        .call(d3.axisLeft(y));

      svg.selectAll('.bar')
        .data(chartData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.value));

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .text(title);
    }
  }
}
</script>

<style scoped>
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  font-family: math;
}

.file-upload {
  padding: 40px;
  border: 1px solid #ccc;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
}

.file-upload-header h3 {
  margin: 0;
  font-family: math;
  align-self: self-start;
}

.file-upload-container {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.custom-file-input {
  display: flex;
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  gap: 10px;
  flex-direction: row-reverse;
  font-family: math;
}

.upload-button {
  display: flex;
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  margin-top: 10px;
  align-self: flex-end;
  gap: 8px;
  flex-direction: row-reverse;
  font-family: math;
}

.upload-button.disabled {
  background-color: #999;
  /* Cinza */
}


.file-input {
  display: none;
}

.file-name {
  margin-left: 10px;
}

.upload-button i {
  margin-left: 5px;
}

.chart-container {
  width: 100%;
  height: 600px;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  width: calc(50% - 8px);
  /* Largura de 50% menos o espaçamento */
  height: auto;
  /* Altura automática */
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  /* Sombra */
}

.card-header {
  background-color: #007bff;
  color: #fff;
  padding: 10px;
  font-weight: bold;
}

.card-body {
  padding: 20px;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.upload-button.disabled {
  background-color: #999;
  /* Cinza */
}
</style>
