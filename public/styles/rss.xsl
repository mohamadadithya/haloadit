<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>
            <xsl:value-of select="rss/channel/title"/>
        </title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"/>
      </head>
      <body class="bg-gray-100 text-gray-900 p-6">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-2xl text-center md:text-left font-semibold mb-6 text-balance">
                <xsl:value-of select="rss/channel/title"/>
          </h1>
          <ul class="space-y-4">
            <xsl:apply-templates select="rss/channel/item"/>
          </ul>
          <div class="mt-6 flex justify-center">
            <a href="/" class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">Kembali ke Halaman Utama</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="item">
    <li class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <a href="{link}" class="block">
        <h2 class="text-xl font-semibold text-blue-600 hover:underline">
          <xsl:value-of select="title"/>
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          Dipublikasikan pada <xsl:value-of select="pubDate"/>
        </p>
        <p class="text-gray-700 mt-2">
          <xsl:value-of select="description"/>
        </p>
      </a>
    </li>
  </xsl:template>
</xsl:stylesheet>
