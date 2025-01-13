import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Configuração do driver do Chrome
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

url = 'https://www.kabum.com.br/hardware/processadores'
driver.get(url)

produtos = []

# Caminho para salvar os arquivos JSON
output_dir = os.path.join(os.getcwd(), 'public', 'data')
os.makedirs(output_dir, exist_ok=True)

# Função para salvar os produtos em um arquivo JSON
def salvar_dados(produtos):
    with open(os.path.join(output_dir, 'cpu.json'), 'w', encoding='utf-8') as f:
        json.dump(produtos, f, ensure_ascii=False, indent=4)

# Função para extrair os dados de cada CPU (por página)
def extrair_cpu(driver):
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')))
    cpus = driver.find_elements(By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')
    for cpu in cpus:
        try:
            imgCpu = cpu.find_element(By.CSS_SELECTOR, 'img.imageCard').get_attribute('src')
            nomeCpu = cpu.find_element(By.CSS_SELECTOR, 'span.sc-d79c9c3f-0.nlmfp.sc-27518a44-9.iJKRqI.nameCard').text
            precoCpu = cpu.find_element(By.CSS_SELECTOR, 'span.sc-57f0fd6e-2.hjJfoh.priceCard').text
            linkCpu = cpu.get_attribute('href')

            produtos.append({
                "img": imgCpu,
                "nome": nomeCpu,
                "preco": precoCpu,
                "link": linkCpu
            })
        except Exception as e:
            print(f"Erro ao extrair dados: {e}")
            continue

# Extrai as CPUs da primeira página
extrair_cpu(driver)
salvar_dados(produtos)

# Tenta navegar nas próximas páginas e extrair as informações das CPUs
while True:
    try:
        # Verifica se o botão "Próxima Página" é clicável
        botao_proxima_pagina = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'a.nextLink'))
        )
        
        # Clica diretamente no botão usando JS
        driver.execute_script("arguments[0].click();", botao_proxima_pagina)
        
        # Aguarda o carregamento da nova página
        WebDriverWait(driver, 15).until(EC.staleness_of(botao_proxima_pagina))
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink'))
        )
        
        # Extrai novamente as CPUs após as validações
        extrair_cpu(driver)
    except Exception as e:
        if "element could not be scrolled into view" in str(e):
            print("O botão 'Próxima Página' não pôde ser encontrado.")
        else:
            print("Não há mais páginas para navegar ou ocorreu um erro:", e)
        break

driver.quit()
