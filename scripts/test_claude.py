import anthropic, os, json

client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
resp = client.messages.create(
    model='claude-sonnet-4-5',
    max_tokens=300,
    messages=[{'role':'user','content':'Question: Add: 6 + (-3). Generator answer: 3. Is the answer correct? Reply with only this JSON: {\"is_correct\": true, \"my_answer\": \"3\", \"confidence\": \"high\", \"format_ok\": true, \"format_note\": null, \"quality\": \"good\", \"quality_note\": null}'}]
)
print(repr(resp.content[0].text))