import re
import pandas as pd
import psycopg2
import os
# Database connection details
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Connection string
connection_string = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Step 1: Read the Logs from a File
with open('output.txt', 'r', encoding='utf-8') as file:
    log_data = file.read()

# Step 2: Parse the Logs using Regular Expressions
pattern = re.compile(
    r'(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}) - User Query: (?P<user_query>.*?)\n'
    r'-+\n'
    r'(?P<contexts>(?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6} - Context Text: .*?\n-+\n)+)'
    r'(?P<response>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6} - Generated Response: .*?)\n'
    r'------------------------------------------------------------------------\n'
    r'------------------------------------------------------------------------\n',
    re.DOTALL
)

matches = pattern.findall(log_data)

# Step 3: Format and Clean the Data
parsed_data = []
for match in matches:
    timestamp, user_query, contexts, response = match
    context_texts = re.findall(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6} - Context Text: (.*?) - Page:', contexts, re.DOTALL)
    context_pages = re.findall(r'- Page: (\d+)', contexts)
    resources = re.findall(r'FilePath: .*\\(.*?\.pdf)', contexts)
    response_text = re.search(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6} - Generated Response: (.*)', response, re.DOTALL).group(1)

    # Clean up any extra spaces
    context_texts = [re.sub(r'\s+', ' ', text.strip()) for text in context_texts]
    response_text = re.sub(r'\s+', ' ', response_text.strip())

    # Ensure there are 5 context texts, pages, and resources; pad with empty strings if necessary
    for _ in range(5 - len(context_texts)):
        context_texts.append('')
        context_pages.append('')
        resources.append('')

    parsed_data.append({
        'timestamp': timestamp,
        'user_query': user_query.strip(),
        'context_text_1': context_texts[0],
        'context_page_number_1': context_pages[0],
        'resource_1': resources[0],
        'context_text_2': context_texts[1],
        'context_page_number_2': context_pages[1],
        'resource_2': resources[1],
        'context_text_3': context_texts[2],
        'context_page_number_3': context_pages[2],
        'resource_3': resources[2],
        'context_text_4': context_texts[3],
        'context_page_number_4': context_pages[3],
        'resource_4': resources[3],
        'context_text_5': context_texts[4],
        'context_page_number_5': context_pages[4],
        'resource_5': resources[4],
        'generated_response': response_text,
        'is_default': True,  # Use True instead of 1 for boolean
        'corrected_response': ''
    })

# Step 4: Store the Data in PostgreSQL
try:
    conn = psycopg2.connect(connection_string)
    conn.set_client_encoding('UTF8')
    c = conn.cursor()
    
    # Create the table
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_logs (
            id SERIAL PRIMARY KEY,
            timestamp TEXT,
            user_query TEXT,
            context_text_1 TEXT,
            context_page_number_1 TEXT,
            resource_1 TEXT,
            context_text_2 TEXT,
            context_page_number_2 TEXT,
            resource_2 TEXT,
            context_text_3 TEXT,
            context_page_number_3 TEXT,
            resource_3 TEXT,
            context_text_4 TEXT,
            context_page_number_4 TEXT,
            resource_4 TEXT,
            context_text_5 TEXT,
            context_page_number_5 TEXT,
            resource_5 TEXT,
            generated_response TEXT,
            is_default BOOLEAN DEFAULT TRUE,
            corrected_response TEXT DEFAULT ''
        )
    ''')

    # Insert data into the table
    for data in parsed_data:
        c.execute('''
            INSERT INTO chat_logs (
                timestamp, user_query, context_text_1, context_page_number_1, resource_1,
                context_text_2, context_page_number_2, resource_2,
                context_text_3, context_page_number_3, resource_3,
                context_text_4, context_page_number_4, resource_4,
                context_text_5, context_page_number_5, resource_5,
                generated_response, is_default, corrected_response
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            data['timestamp'], data['user_query'], data['context_text_1'], data['context_page_number_1'], data['resource_1'],
            data['context_text_2'], data['context_page_number_2'], data['resource_2'],
            data['context_text_3'], data['context_page_number_3'], data['resource_3'],
            data['context_text_4'], data['context_page_number_4'], data['resource_4'],
            data['context_text_5'], data['context_page_number_5'], data['resource_5'],
            data['generated_response'], data['is_default'], data['corrected_response']
        ))

    conn.commit()
    print("Data has been stored in PostgreSQL successfully.")
except psycopg2.OperationalError as e:
    print(f"OperationalError: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    if conn:
        conn.close()

# Step 5: Empty the output.txt file
with open('output.txt', 'w', encoding='utf-8') as file:
    pass  # This will truncate the file to zero length