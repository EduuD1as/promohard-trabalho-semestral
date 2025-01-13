import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# Configuração do Chrome (driver)
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

url = 'https://www.kabum.com.br/hardware/coolers'
driver.get(url)

produtos = []

# Caminho para salvar os arquivos JSON
output_dir = os.path.join(os.getcwd(), 'public', 'data')
os.makedirs(output_dir, exist_ok=True)

# Função para salvar os produtos em um arquivo JSON
def salvar_dados(produtos):
    with open(os.path.join(output_dir, 'cooling.json'), 'w', encoding='utf-8') as f:
        json.dump(produtos, f, ensure_ascii=False, indent=4)

# Função principal para extrair os elementos dos produtos
def extrair_produtos(driver):
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')))
    items = driver.find_elements(By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')
    for item in items:
        try:
            img = item.find_element(By.CSS_SELECTOR, 'img.imageCard').get_attribute('src')
            nome = item.find_element(By.CSS_SELECTOR, 'span.sc-d79c9c3f-0.nlmfp.sc-27518a44-9.iJKRqI.nameCard').text
            preco = item.find_element(By.CSS_SELECTOR, 'span.sc-57f0fd6e-2.hjJfoh.priceCard').text
            link = item.get_attribute('href')

            produtos.append({
                "img": img,
                "nome": nome,
                "preco": preco,
                "link": link
            })
        except Exception as e:
            print(f"Erro ao extrair dados: {e}")
            continue

# Primeira extração
extrair_produtos(driver)
salvar_dados(produtos)

while True:
    try:
        botao_proxima_pagina = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'a.nextLink'))
        )
        driver.execute_script("arguments[0].click();", botao_proxima_pagina)
        WebDriverWait(driver, 15).until(EC.staleness_of(botao_proxima_pagina))
        extrair_produtos(driver)
        salvar_dados(produtos)  # Salva os dados a cada página para garantir que nada se perca
    except Exception as e:
        print("Fim das páginas ou erro:", e)
        break

driver.quit()
