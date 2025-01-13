import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# configuração do chrome (driver)
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

url = 'https://www.kabum.com.br/hardware/memoria-ram'
driver.get(url)

produtos = []

# Caminho para salvar os arquivos JSON
output_dir = os.path.join(os.getcwd(), 'public', 'data')
os.makedirs(output_dir, exist_ok=True)

# Função para salvar os produtos em um arquivo JSON
def salvar_dados(produtos):
    with open(os.path.join(output_dir, 'ram.json'), 'w', encoding='utf-8') as f:
        json.dump(produtos, f, ensure_ascii=False, indent=4)

# função principal para extrair os elementos dos produtos
def extrair_cpu(driver):
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')))
    rams = driver.find_elements(By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink')
    for ram in rams:
        try:
            imgRam = ram.find_element(By.CSS_SELECTOR, 'img.imageCard').get_attribute('src')
            nomeRam = ram.find_element(By.CSS_SELECTOR, 'span.sc-d79c9c3f-0.nlmfp.sc-27518a44-9.iJKRqI.nameCard').text
            precoRam = ram.find_element(By.CSS_SELECTOR, 'span.sc-57f0fd6e-2.hjJfoh.priceCard').text
            linkRam = ram.get_attribute('href')

            produtos.append({
                "img": imgRam,
                "nome": nomeRam,
                "preco": precoRam,
                "link": linkRam
            })
        except Exception as e:
            print(f"Erro ao extrair dados: {e}")
            continue

extrair_cpu(driver)
salvar_dados(produtos)

while True:
    try:
        # verifica se o botão "Próxima Página" é clicável
        botao_proxima_pagina = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'a.nextLink'))
        )
        
        # clica diretamente no botão usando JS
        driver.execute_script("arguments[0].click();", botao_proxima_pagina)
        
        # Aguarda o carregamento da nova página
        WebDriverWait(driver, 15).until(EC.staleness_of(botao_proxima_pagina))
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a.sc-27518a44-4.kVoakD.productLink'))
        )
        
        # Extrai novamente após as validações
        extrair_cpu(driver)
    except Exception as e:
        if "element could not be scrolled into view" in str(e):
            print("O botão 'Próxima Página' não pôde ser encontrado.")
        else:
            print("Não há mais páginas para navegar ou ocorreu um erro:", e)
        break

driver.quit()
