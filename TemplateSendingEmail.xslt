<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.5" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl">
	<xsl:output method="xml" omit-xml-declaration="yes" indent="yes"/>
	<xsl:template match="/">
		<html lang="es">
			<head>
				<meta charset="UTF-8"/>
				<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
			</head>
			<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
				<div style="background-color: #ffffff; border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 30px; max-width: 600px; margin: auto;">
					<div style="padding-left: 15px;">
						<img src="{top/DataInfo/@urlbackgroundimghead}" height="500px" alt="URL-Background-Img-Head-Email" style="width: 100%; height: 500px; object-fit: cover;"/>
					</div>
					<div style="padding-left: 15px; padding-bottom: 15px;">
						<h1 style="color: #868686; font-size: 24px; margin-bottom: 20px; text-align: center;">
							<xsl:value-of select="top/DataInfo/@messagehead"/>
						</h1>
						<p style="color: #555; line-height: 1.6;">
							¡Hola <span style="font-weight: bold; color: #333;"><xsl:value-of select="top/DataInfo/@personnametosendemail"/></span>!
						</p>
						<p style="color: #555; line-height: 1.6;">
							<xsl:value-of select="top/DataInfo/@messagebody"/>
						</p>
						<div style="display: flex; text-align:center;justify-content: center;align-items: center;">
							<a href="{top/DataInfo/@urlrecommendation}" style="">
								<img src="{top/DataInfo/@urlbackgroundimgclickhref}" height="70px" alt="URL-Background-Img-ClickHref-Email" style="object-fit: cover;"/>
							</a>
						</div>
					</div>
					<div style="text-align: center; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px;">
						<p>Este es un correo informativo, por favor no responda a este mensaje.</p>
						<img src="{top/DataInfo/@urlbackgroundimgfooter}" alt="URL-Background-Img-Footer-Email" style="width: 100%; object-fit: cover;"/>
					</div>
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
