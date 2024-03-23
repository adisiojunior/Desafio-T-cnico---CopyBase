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
          <div class="card full-width">
            <div class="card-header">
              <h4>Gráfico Comparativo</h4>
              <button @click="clearSelection" class="clear-button">
                <i class="fas fa-times"></i> Limpar Seleção
              </button>

            </div>
            <div class="card-body">
              <div class="chart-container" ref="comparativeChart"></div>
              <div class="metric-buttons">
                <button v-for="metric in availableMetrics" :key="metric" @click="toggleMetric(metric)"
                  :class="{ 'selected': selectedMetrics.includes(metric) }">{{ metric }}</button>
              </div>
            </div>
          </div>
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
      invalidFileFormat: false,
      availableMetrics: ['Churn Rate', 'MRR', 'Total Ativa', 'Total Atrasada', 'Total Canceled'],
      selectedMetrics: []
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
          this.invalidFileFormat = false; 
        } else {
          this.invalidFileFormat = true;
        }
      }
      if (!this.file || this.file.type !== newFile.type) {
        this.response = null;
        this.lastUploadedFileName = null;
      }

      this.file = newFile;
    },
    uploadFile() {
      if (!this.file || this.invalidFileFormat) {
        this.response = null;
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

        d3.select(this.$refs.mrrChart).select("svg").remove();
        d3.select(this.$refs.churnRateChart).select("svg").remove();

        this.createChart(data.monthly_metrics, 'mrr', '', this.$refs.mrrChart);
        this.createChart(data.monthly_metrics, 'churn_rate', '', this.$refs.churnRateChart);
      };

      waitForElements();
    },
    createChart(data, key, title, element) {
      const chartData = Object.entries(data).map(([month, metrics]) => {
        return { month, value: metrics[key] };
      });

      const margin = { top: 20, right: 30, bottom: 60, left: 60 };
      const width = element.offsetWidth - margin.left - margin.right;
      const height = element.offsetHeight - margin.top - margin.bottom;

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
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-65)');

      svg.append('g')
        .call(d3.axisLeft(y));

      svg.selectAll('.bar')
        .data(chartData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.month))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', 'steelblue')
        .on('mouseover', function (d) {
          d3.select(this).attr('fill', 'orange');
          svg.append('text')
            .attr('id', 'tooltip')
            .attr('x', x(d.month) + x.bandwidth() / 2)
            .attr('y', y(d.value) - 5)
            .attr('text-anchor', 'middle')
            .text(d.value);
        })
        .on('mouseout', function () {
          d3.select(this).attr('fill', 'steelblue');
          svg.select('#tooltip').remove();
        });

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 20)
        .attr('text-anchor', 'middle')
        .text(title);

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 40)
        .attr('text-anchor', 'middle')
    },
    updateComparativeChart() {
      if (this.selectedMetrics.length < 2) {
        return;
      }

      d3.select(this.$refs.comparativeChart).select("svg").remove();

      const chartData = {};
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
      const allChartData = []; 
      this.selectedMetrics.forEach((metric) => {
        chartData[metric] = Object.entries(this.response.monthly_metrics).map(([month, metrics]) => {
          const value = metrics[metric.toLowerCase().replace(' ', '_')];
          return { month, value };
        });
        allChartData.push(...chartData[metric]);
      });

      const margin = { top: 20, right: 30, bottom: 60, left: 60 };
      const width = this.$refs.comparativeChart.offsetWidth - margin.left - margin.right;
      const height = this.$refs.comparativeChart.offsetHeight - margin.top - margin.bottom;

      const svg = d3.select(this.$refs.comparativeChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const monthNames = {
        January: 'Janeiro',
        February: 'Fevereiro',
        March: 'Março',
        April: 'Abril',
        May: 'Maio',
        June: 'Junho',
        July: 'Julho',
        August: 'Agosto',
        September: 'Setembro',
        October: 'Outubro',
        November: 'Novembro',
        December: 'Dezembro'
      };

      const x = d3.scaleBand()
        .domain(allChartData.map(d => monthNames[d.month]))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(allChartData, d => d.value)])
        .nice()
        .range([height, 0]);

      this.selectedMetrics.forEach((metric, index) => {
        const line = d3.line()
          .x(d => x(monthNames[d.month]) + x.bandwidth() / 2)
          .y(d => y(d.value));

        svg.append('path')
          .datum(chartData[metric])
          .attr('fill', 'none')
          .attr('stroke', colorScale(index))
          .attr('stroke-width', 2)
          .attr('d', line);

        svg.selectAll('.dot-' + metric)
          .data(chartData[metric])
          .enter().append('circle')
          .attr('class', 'dot-' + metric)
          .attr('cx', d => x(monthNames[d.month]) + x.bandwidth() / 2)
          .attr('cy', d => y(d.value))
          .attr('r', 5)
          .style('fill', colorScale(index))
          .on('mouseover', function () {
            const d = d3.select(this).datum();
            d3.select(this).attr('r', 8);
            svg.append('text')
              .attr('class', 'tooltip')
              .attr('x', x(monthNames[d.month]) + x.bandwidth() / 2)
              .attr('y', y(d.value) - 10)
              .attr('text-anchor', 'middle')
              .text('Mês: ' + monthNames[d.month] + ', Valor: ' + d.value);
          })
          .on('mouseout', function () {
            d3.select(this).attr('r', 5);
            svg.selectAll('.tooltip').remove();
          });

        const legend = svg.append('g')
          .attr('class', 'legend')
          .attr('transform', 'translate(20,20)');

        legend.append('rect')
          .attr('x', width - 100)
          .attr('y', index * 20)
          .attr('width', 10)
          .attr('height', 10)
          .style('fill', colorScale(index));

        legend.append('text')
          .attr('x', width - 85)
          .attr('y', index * 20 + 9)
          .attr('dy', '.35em')
          .style('text-anchor', 'start')
          .text(metric);
      });

      svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-65)');

      svg.append('g')
        .call(d3.axisLeft(y));

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 20)
        .attr('text-anchor', 'middle');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle');

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 40)
        .attr('text-anchor', 'middle');
    },
    toggleMetric(metric) {
      if (this.selectedMetrics.includes(metric)) {
        this.selectedMetrics = this.selectedMetrics.filter(item => item !== metric);
      } else {
        if (this.selectedMetrics.length < 2) {
          this.selectedMetrics.push(metric);
        }
      }

      this.updateComparativeChart();
    },
    clearSelection() {
      this.selectedMetrics = [];
      d3.select(this.$refs.comparativeChart).select("svg").remove();
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
  height: auto;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
}

.full-width {
  width: 100%;
  margin-bottom: 16px;
}

.metric-buttons {
  margin-bottom: 20px;
}

.metric-buttons button {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 5px;
  padding: 8px 16px;
  margin-right: 10px;
  cursor: pointer;
}

.metric-buttons button.selected {
  background-color: #007bff;
  color: #fff;
}

.metric-buttons button:hover {
  background-color: #007bff;
  color: #fff;
}

.metric-buttons button:last-child {
  margin-right: 0;
}

.chart-container {
  width: 100%;
  height: 600px;
}

.clear-button {
  background-color: transparent;
  color: black;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  background-color: white;
}

</style>
