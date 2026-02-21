## 调用示例

import requests, base64

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = True

def read_b64(path):
with open(path, "rb") as f:
return base64.b64encode(f.read()).decode()

headers = {
"Authorization": "Bearer $NVIDIA_API_KEY",
"Accept": "text/event-stream" if stream else "application/json"
}

payload = {
"model": "qwen/qwen3.5-397b-a17b",
"messages": [{"role":"user","content":""}],
"max_tokens": 16384,
"temperature": 0.60,
"top_p": 0.95,
"top_k": 20,
"presence_penalty": 0,
"repetition_penalty": 1,
"stream": stream,
"chat_template_kwargs": {"enable_thinking":True},
}
payload["tools"] = [{"type":"function","function":{"name":"describe_harry_potter_character","description":"Returns information and images of Harry Potter characters.","parameters":{"type":"object","properties":{"name":{"type":"string","enum":["Harry James Potter","Hermione Jean Granger","Ron Weasley","Fred Weasley","George Weasley","Bill Weasley","Percy Weasley","Charlie Weasley","Ginny Weasley","Molly Weasley","Arthur Weasley","Neville Longbottom","Luna Lovegood","Draco Malfoy","Albus Percival Wulfric Brian Dumbledore","Minerva McGonagall","Remus Lupin","Rubeus Hagrid","Sirius Black","Severus Snape","Bellatrix Lestrange","Lord Voldemort","Cedric Diggory","Nymphadora Tonks","James Potter"],"description":"Name of the Harry Potter character"}},"required":["name"]}}},{"type":"function","function":{"name":"name_a_color","description":"A tool that returns a bunch of color names for a given color_hex.","parameters":{"type":"object","properties":{"color_hex":{"type":"string","description":"A hexadecimal color value which must be represented as a string."}},"required":["color_hex"]}}}]
payload["tool_choice"] = "auto"

response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
if stream:
for line in response.iter_lines():
if line:
print(line.decode("utf-8"))
else:
print(response.json())

## Request response from the model

post
https://integrate.api.nvidia.com/v1/chat/completions

Invokes inference using the model chat parameters. If uploading large images, this POST should be used in conjunction with the NVCF API which allows for the upload of large assets.
You can find details on how to use NVCF Asset APIs here: https://docs.api.nvidia.com/cloud-functions/reference/createasset

Recent Requests
Log in to see full request history
Time Status User Agent
Make a request to see history.
0 Requests This Month

Body Params
messages
array of objects
required
length ≥ 1
A list of messages comprising the conversation so far.

object

role
string
enum
required
The role of the message's author.

system
Allowed:

system

assistant

user
content
required
The contents of the message.

To pass images/videos (only with role=user):

- When content is a string, images can be passed with img HTML tags that wrap an image URL (<img src="{url}" />), base64 image data (<img src="data:image/{format};base64,{base64encodedimage}" />), or an NVCF asset ID (<img src="data:image/{format};asset_id,{asset_id}" />).

- When content is a list of objects, images can be passed as objects with type=image_url, and videos can be passed as objects with type=video_url.

For system and assistant roles, the object list format is not supported.

string

array

ADD object
model
string
required
Defaults to qwen/qwen3.5-397b-a17b
The model to use.

qwen/qwen3.5-397b-a17b
chat_template_kwargs
Optional kwargs forwarded to the model chat template. Use {"enable_thinking": true} to enable thinking mode or {"enable_thinking": false} to disable it.

object

null
tools
Optional OpenAI-compatible tool definitions for function calling.

array

null
max_tokens
Defaults to 16384
The maximum number of tokens that can be generated.

integer

null
seed
Changing the seed will produce a different response with similar characteristics. Fixing the seed will reproduce the same results if all other parameters are also kept constant.

integer

null
stream
Defaults to false
If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a data: [DONE]

boolean

null
temperature
Defaults to 0.6
What sampling temperature to use, between 0 and 1. Recommended values are 0.6 in thinking mode and 0.7 in non-thinking mode.

number

null
top_p
Defaults to 0.95
Nucleus sampling threshold. Recommended values are 0.95 in thinking mode and 0.8 in non-thinking mode.

number

null
top_k
Defaults to 20
Limits sampling to the top_k most likely tokens. Recommended value is 20 for both thinking and non-thinking modes.

integer

null
presence_penalty
Defaults to 0
Penalizes tokens already present in the generated text. Recommended values are 0.0 in thinking mode and 1.5 in non-thinking mode.

number

null
repetition_penalty
Defaults to 1
Penalty applied to repeated tokens. Recommended value is 1.0 for both thinking and non-thinking modes.

number

null
Headers
NVCF-INPUT-ASSET-REFERENCES
uuid
length ≤ 370
String of asset IDs separated by commas. Data is uploaded to AWS S3 using NVCF Asset APIs and associated with these asset IDs.If the size of an image is more than 180KB, it needs to be uploaded to a presigned S3 URL bucket. The presigned URL allows for secure and temporary access to the S3 bucket for uploading the image. Once the asset is requested, an asset ID is generated for it. Please include this asset ID in this header and to use the uploaded image in a prompt, you need to refer to it using the following format: <img src="data:image/png;asset_id,{asset_id}" />.

accept
string
enum
Defaults to application/json
Generated from available response content types

application/json
Allowed:

application/json

text/event-stream
Responses

200
Invocation is fulfilled

202
Result is pending. Client should poll using the requestId.

422
Validation failed, provided entity could not be processed.

500
The invocation ended with an error.

## Gets the result of an earlier function invocation request that returned a status of 202.

Gets the result of an earlier function invocation request that returned a status of 202.
get
https://integrate.api.nvidia.com/v1/status/{requestId}

Recent Requests
Log in to see full request history
Time Status User Agent
Make a request to see history.
0 Requests This Month

Path Params
requestId
uuid
required
length ≤ 36
requestId to poll results

Responses

200
Invocation is fulfilled

202
Result is pending. Client should poll using the requestId.

422
The invocation ended with an error.

500
The invocation ended with an error.
